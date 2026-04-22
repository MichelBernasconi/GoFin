use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct UiResult {
    pub final_value: f64,
    pub total_return: f64,
    pub max_drawdown: f64,
    pub data_points: Vec<UiPricePoint>,
    pub trades: Vec<Trade>,
}

#[derive(Serialize, Deserialize)]
pub struct UiPricePoint {
    pub date: String,
    pub price: f64,
    pub trade: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct Trade {
    pub id: String,
    pub date: String,
    pub side: String,
    pub price: f64,
    pub qty: f64,
    pub total: f64,
    pub pnl: Option<f64>,
}

#[derive(Deserialize)]
struct SupabasePrice {
    date: String,
    close: f64,
}

fn calculate_sma(prices: &[f64], period: usize) -> Vec<f64> {
    let mut sma = vec![0.0; prices.len()];
    for i in 0..prices.len() {
        if i >= period - 1 { sma[i] = prices[i + 1 - period..i + 1].iter().sum::<f64>() / period as f64; }
    }
    sma
}

fn calculate_rsi(prices: &[f64], period: usize) -> Vec<f64> {
    let mut rsi = vec![50.0; prices.len()];
    if prices.len() < period + 1 { return rsi; }
    for i in period..prices.len() {
        let mut gains = 0.0;
        let mut losses = 0.0;
        for j in i - period + 1..i + 1 {
            let diff = prices[j] - prices[j-1];
            if diff > 0.0 { gains += diff; } else { losses -= diff; }
        }
        let rs = if losses == 0.0 { 100.0 } else { gains / losses };
        rsi[i] = 100.0 - (100.0 / (1.0 + rs));
    }
    rsi
}

#[tauri::command]
async fn run_simulation(
    initial_capital: f64,
    startDate: String,
    endDate: String,
    symbol: String,
    strategyId: String
) -> Result<UiResult, String> {
    let supabase_url = "https://wvoqjzpapebtlczxiztp.supabase.co";
    let supabase_key = "sb_publishable_BAkgODZJrFKsXgjEM90f7w_N8_jZxLx";

    let url = format!("{}/rest/v1/historical_prices?symbol=eq.{}&date=gte.{}&date=lte.{}&select=date,close&order=date.asc", 
        supabase_url, symbol, startDate, endDate);

    let client = reqwest::Client::new();
    let response = client.get(&url).header("apikey", supabase_key).header("Authorization", format!("Bearer {}", supabase_key)).send().await.map_err(|e| e.to_string())?;
    let raw_prices: Vec<SupabasePrice> = response.json().await.map_err(|e| e.to_string())?;

    if raw_prices.is_empty() { return Err("No data available".to_string()); }

    let close_prices: Vec<f64> = raw_prices.iter().map(|p| p.close).collect();
    let mut buy_signals = vec![false; raw_prices.len()];
    let mut sell_signals = vec![false; raw_prices.len()];

    match strategyId.as_str() {
        "rsi" => {
            let rsi = calculate_rsi(&close_prices, 14);
            for i in 1..rsi.len() { if rsi[i] < 30.0 { buy_signals[i] = true; } else if rsi[i] > 70.0 { sell_signals[i] = true; } }
        },
        "sma" => {
            let fast = calculate_sma(&close_prices, 20);
            let slow = calculate_sma(&close_prices, 50);
            for i in 1..fast.len() { if fast[i-1] <= slow[i-1] && fast[i] > slow[i] { buy_signals[i] = true; } else if fast[i-1] >= slow[i-1] && fast[i] < slow[i] { sell_signals[i] = true; } }
        },
        _ => {
            let sma = calculate_sma(&close_prices, 20);
            for i in 1..sma.len() { if close_prices[i] < sma[i] * 0.98 { buy_signals[i] = true; } else if close_prices[i] > sma[i] * 1.05 { sell_signals[i] = true; } }
        }
    }

    let mut trades = Vec::new();
    let mut data_points = Vec::new();
    let mut current_capital = initial_capital;
    let mut position_qty = 0.0;
    let mut last_buy_price = 0.0;
    let mut max_equity = initial_capital;
    let mut max_dd = 0.0;

    for i in 0..raw_prices.len() {
        let p = &raw_prices[i];
        let mut executed_side = None;
        
        if buy_signals[i] && position_qty == 0.0 {
            position_qty = current_capital / p.close;
            executed_side = Some("BUY".to_string());
            last_buy_price = p.close;
            trades.push(Trade { 
                id: i.to_string(), date: p.date.clone(), side: "BUY".to_string(), 
                price: p.close, qty: position_qty, total: current_capital, pnl: None 
            });
        } else if sell_signals[i] && position_qty > 0.0 {
            let pnl = (p.close - last_buy_price) / last_buy_price * 100.0;
            let sale_value = position_qty * p.close;
            trades.push(Trade { 
                id: i.to_string(), date: p.date.clone(), side: "SELL".to_string(), 
                price: p.close, qty: position_qty, total: sale_value, pnl: Some(pnl) 
            });
            current_capital = sale_value;
            position_qty = 0.0;
            executed_side = Some("SELL".to_string());
        }

        let equity = if position_qty > 0.0 { position_qty * p.close } else { current_capital };
        if equity > max_equity { max_equity = equity; }
        let dd = (equity - max_equity) / max_equity * 100.0;
        if dd < max_dd { max_dd = dd; }

        data_points.push(UiPricePoint { date: p.date.clone(), price: p.close, trade: executed_side });
    }

    Ok(UiResult {
        final_value: if position_qty > 0.0 { position_qty * close_prices.last().unwrap() } else { current_capital },
        total_return: (( (if position_qty > 0.0 { position_qty * close_prices.last().unwrap() } else { current_capital }) - initial_capital) / initial_capital) * 100.0,
        max_drawdown: max_dd,
        data_points,
        trades,
    })
}

#[tauri::command]
async fn get_market_data(symbol: String, start: String, end: String) -> Result<Vec<UiPricePoint>, String> {
    let supabase_url = "https://wvoqjzpapebtlczxiztp.supabase.co";
    let supabase_key = "sb_publishable_BAkgODZJrFKsXgjEM90f7w_N8_jZxLx";
    let url = format!("{}/rest/v1/historical_prices?symbol=eq.{}&date=gte.{}&date=lte.{}&select=date,close&order=date.asc", supabase_url, symbol, start, end);
    let client = reqwest::Client::new();
    let response = client.get(&url).header("apikey", supabase_key).header("Authorization", format!("Bearer {}", supabase_key)).send().await.map_err(|e| e.to_string())?;
    let prices: Vec<SupabasePrice> = response.json().await.map_err(|e| e.to_string())?;
    Ok(prices.into_iter().map(|p| UiPricePoint { date: p.date, price: p.close, trade: None }).collect())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .invoke_handler(tauri::generate_handler![run_simulation, get_market_data])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
