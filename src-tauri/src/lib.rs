use tauri_plugin_shell::ShellExt;
use std::fs;
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct SimulationResult {
    pub total_return: f64,
    pub annual_return: f64,
    pub max_drawdown: f64,
    pub final_value: f64,
    pub execution_time: String,
    pub trades: Vec<serde_json::Value>,
}

#[tauri::command]
async fn run_simulation(app_handle: tauri::AppHandle, initial_capital: f64) -> Result<SimulationResult, String> {
    let start = std::time::Instant::now();
    
    // 1. Prepare binary file for Go
    let temp_data = format!("CAPITAL:{}", initial_capital);
    let temp_path = "strategy_temp.bin";
    fs::write(temp_path, temp_data).map_err(|e| e.to_string())?;

    // 2. Call Go Sidecar
    let status = app_handle.shell().sidecar("gofin-bridge")
        .map_err(|e| format!("Failed to create sidecar command: {}", e))?
        .args(["--save", temp_path])
        .output()
        .await
        .map_err(|e| format!("Sidecar execution failed: {}", e))?;

    if !status.status.success() {
        return Err(format!("Go Bridge Error: {}", String::from_utf8_lossy(&status.stderr)));
    }

    // 3. Engine Calculation (using mocked data for UI for now)
    let result = SimulationResult {
        total_return: 24.5,
        annual_return: 18.2,
        max_drawdown: -8.4,
        final_value: initial_capital * 1.245,
        execution_time: format!("{:?}", start.elapsed()),
        trades: vec![],
    };

    Ok(result)
}

#[tauri::command]
async fn get_saved_strategies(app_handle: tauri::AppHandle) -> Result<String, String> {
    let output_path = "strategies_out.bin";
    
    let status = app_handle.shell().sidecar("gofin-bridge")
        .map_err(|e| format!("Failed to create sidecar command: {}", e))?
        .args(["--load", output_path])
        .output()
        .await
        .map_err(|e| format!("Sidecar execution failed: {}", e))?;

    if !status.status.success() {
        return Ok("[]".to_string());
    }

    let data = fs::read_to_string(output_path).map_err(|e| e.to_string())?;
    Ok(data)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::default().build())
    .plugin(tauri_plugin_shell::init())
    .invoke_handler(tauri::generate_handler![run_simulation, get_saved_strategies])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
