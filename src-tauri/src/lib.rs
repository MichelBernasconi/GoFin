use serde::{Deserialize, Serialize};
use rust_decimal::prelude::*;
use rust_decimal_macros::dec;
use chrono::{Datelike, NaiveDate};

#[derive(Serialize, Deserialize)]
pub struct UiResult {
    pub final_value: f64,
    pub total_return: f64,
    pub benchmark_return: f64,
    pub max_drawdown: f64,
    pub data_points: Vec<UiPricePoint>,
    pub trades: Vec<Trade>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct UiPricePoint {
    pub date: String,
    pub open: f64,
    pub high: f64,
    pub low: f64,
    pub close: f64,
    pub equity: f64,
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

#[derive(Deserialize, Clone)]
struct SupabasePrice {
    date: String,
    open: Decimal,
    high: Decimal,
    low: Decimal,
    close: Decimal,
}

fn aggregate_data(raw: Vec<SupabasePrice>, timeframe: &str) -> Vec<SupabasePrice> {
    if timeframe == "1D" || raw.is_empty() { return raw; }

    let mut aggregated = Vec::new();
    let mut current_group: Vec<SupabasePrice> = Vec::new();
    let mut last_key = String::new();

    for p in raw {
        let date_str = if p.date.len() > 10 { &p.date[..10] } else { &p.date };
        let date_res = NaiveDate::parse_from_str(date_str, "%Y-%m-%d");
        if date_res.is_err() { continue; }
        let date = date_res.unwrap();
        
        let key = match timeframe {
            "1W" => format!("{}-W{:02}", date.year(), date.iso_week().week()),
            "1M" => format!("{}-M{:02}", date.year(), date.month()),
            "1Y" => format!("{}", date.year()),
            _ => p.date.clone(),
        };

        if key != last_key && !current_group.is_empty() {
            aggregated.push(collapse_group(&current_group));
            current_group.clear();
        }
        last_key = key;
        current_group.push(p);
    }
    if !current_group.is_empty() {
        aggregated.push(collapse_group(&current_group));
    }
    aggregated
}

fn collapse_group(group: &[SupabasePrice]) -> SupabasePrice {
    let first = &group[0];
    let last = &group[group.len() - 1];
    let mut high = first.high;
    let mut low = first.low;
    for p in group {
        if p.high > high { high = p.high; }
        if p.low < low { low = p.low; }
    }
    SupabasePrice {
        date: last.date.clone(),
        open: first.open,
        high,
        low,
        close: last.close,
    }
}

fn calculate_sma(prices: &[Decimal], period: usize) -> Vec<Decimal> {
    let mut sma = vec![dec!(0); prices.len()];
    for i in 0..prices.len() {
        if i >= period - 1 {
            let sum: Decimal = prices[i + 1 - period..i + 1].iter().sum();
            sma[i] = sum / Decimal::from(period);
        }
    }
    sma
}

#[tauri::command]
async fn run_simulation(
    initial_capital: f64,
    startDate: String,
    endDate: String,
    symbol: String,
    _strategyId: String,
    timeframe: String
) -> Result<UiResult, String> {
    let supabase_url = "https://wvoqjzpapebtlczxiztp.supabase.co";
    let supabase_key = "sb_publishable_BAkgODZJrFKsXgjEM90f7w_N8_jZxLx";

    let url = format!("{}/rest/v1/historical_prices?symbol=eq.{}&date=gte.{}&date=lte.{}&select=date,open,high,low,close&order=date.asc", 
        supabase_url, symbol, startDate, endDate);

    let client = reqwest::Client::new();
    let response = client.get(&url).header("apikey", supabase_key).header("Authorization", format!("Bearer {}", supabase_key)).send().await.map_err(|e| e.to_string())?;
    let daily_prices: Vec<SupabasePrice> = response.json().await.map_err(|e| e.to_string())?;

    if daily_prices.is_empty() { return Err("No data".to_string()); }

    let raw_prices = aggregate_data(daily_prices, &timeframe);
    if raw_prices.is_empty() { return Err("No data after aggregation".to_string()); }

    let close_prices: Vec<Decimal> = raw_prices.iter().map(|p| p.close).collect();
    let sma_fast = calculate_sma(&close_prices, 20);
    let sma_slow = calculate_sma(&close_prices, 50);

    let mut trades = Vec::new();
    let mut data_points = Vec::new();
    let mut current_capital = Decimal::from_f64(initial_capital).unwrap_or(dec!(0));
    let mut position_qty = dec!(0);
    let mut last_buy_price = dec!(0);
    let mut max_equity = current_capital;
    let mut max_dd = dec!(0);

    for i in 0..raw_prices.len() {
        let p = &raw_prices[i];
        let mut executed_side = None;
        
        if i > 50 {
            let buy_signal = sma_fast[i-1] <= sma_slow[i-1] && sma_fast[i] > sma_slow[i];
            let sell_signal = sma_fast[i-1] >= sma_slow[i-1] && sma_fast[i] < sma_slow[i];

            if buy_signal && position_qty == dec!(0) {
                position_qty = (current_capital / p.close).round_dp(6);
                last_buy_price = p.close;
                executed_side = Some("BUY".to_string());
                trades.push(Trade { 
                    id: i.to_string(), date: p.date.clone(), side: "BUY".to_string(), 
                    price: p.close.to_f64().unwrap_or(0.0), qty: position_qty.to_f64().unwrap_or(0.0), 
                    total: (position_qty * p.close).to_f64().unwrap_or(0.0), pnl: None 
                });
            } else if sell_signal && position_qty > dec!(0) {
                let pnl = ((p.close - last_buy_price) / last_buy_price * dec!(100)).round_dp(2);
                let sale_value = position_qty * p.close;
                trades.push(Trade { 
                    id: i.to_string(), date: p.date.clone(), side: "SELL".to_string(), 
                    price: p.close.to_f64().unwrap_or(0.0), qty: position_qty.to_f64().unwrap_or(0.0), 
                    total: sale_value.to_f64().unwrap_or(0.0), pnl: Some(pnl.to_f64().unwrap_or(0.0)) 
                });
                current_capital = sale_value;
                position_qty = dec!(0);
                executed_side = Some("SELL".to_string());
            }
        }

        let equity = if position_qty > dec!(0) { position_qty * p.close } else { current_capital };
        if equity > max_equity { max_equity = equity; }
        let dd = if max_equity > dec!(0) { ((equity - max_equity) / max_equity * dec!(100)).round_dp(2) } else { dec!(0) };
        if dd < max_dd { max_dd = dd; }

        data_points.push(UiPricePoint { 
            date: p.date.clone(), 
            open: p.open.to_f64().unwrap_or(0.0),
            high: p.high.to_f64().unwrap_or(0.0),
            low: p.low.to_f64().unwrap_or(0.0),
            close: p.close.to_f64().unwrap_or(0.0),
            equity: equity.to_f64().unwrap_or(0.0),
            trade: executed_side 
        });
    }

    let final_price = raw_prices.last().map(|p| p.close).unwrap_or(dec!(1));
    let final_equity = if position_qty > dec!(0) { position_qty * final_price } else { current_capital };
    let initial_cap_dec = Decimal::from_f64(initial_capital).unwrap_or(dec!(1));
    let total_return = if initial_cap_dec != dec!(0) { 
        ((final_equity - initial_cap_dec) / initial_cap_dec * dec!(100)).round_dp(2) 
    } else { 
        dec!(0) 
    };

    let first_price = raw_prices.first().map(|p| p.close).unwrap_or(dec!(1));
    let benchmark_return = ((final_price - first_price) / first_price * dec!(100)).round_dp(2);

    Ok(UiResult {
        final_value: final_equity.to_f64().unwrap_or(0.0),
        total_return: total_return.to_f64().unwrap_or(0.0),
        benchmark_return: benchmark_return.to_f64().unwrap_or(0.0),
        max_drawdown: max_dd.to_f64().unwrap_or(0.0),
        data_points,
        trades,
    })
}

#[tauri::command]
async fn run_monte_carlo(initial_capital: f64, symbol: String, timeframe: String) -> Result<Vec<f64>, String> {
    // 1. Recuperiamo i dati storici reali per il bootstrap
    let market_data = get_market_data(symbol, "2023-01-01".to_string(), "2024-01-01".to_string(), timeframe).await?;
    
    if market_data.len() < 2 {
        return Err("Dati insufficienti per Monte Carlo".to_string());
    }

    // 2. Calcoliamo i rendimenti storici logaritmici/percentuali
    let mut historical_returns = Vec::new();
    for i in 1..market_data.len() {
        let prev = market_data[i-1].close;
        let curr = market_data[i].close;
        if prev > 0.0 {
            historical_returns.push(curr / prev);
        }
    }

    // 3. Simulazione Monte Carlo tramite Bootstrapping (Rimescolamento rendimenti reali)
    use rand::seq::SliceRandom;
    let mut rng = rand::thread_rng();
    let mut results = Vec::new();
    
    for _ in 0..50 {
        let mut equity = initial_capital;
        // Rimescoliamo i rendimenti per creare un "nuovo" scenario basato su dati reali
        let mut shuffled_returns = historical_returns.clone();
        shuffled_returns.shuffle(&mut rng);
        
        for ret in shuffled_returns {
            equity *= ret;
        }
        results.push(equity);
    }
    
    Ok(results)
}

#[tauri::command]
async fn get_market_data(symbol: String, start: String, end: String, timeframe: String) -> Result<Vec<UiPricePoint>, String> {
    let supabase_url = "https://wvoqjzpapebtlczxiztp.supabase.co";
    let supabase_key = "sb_publishable_BAkgODZJrFKsXgjEM90f7w_N8_jZxLx";
    let url = format!("{}/rest/v1/historical_prices?symbol=eq.{}&date=gte.{}&date=lte.{}&select=date,open,high,low,close&order=date.asc", supabase_url, symbol, start, end);
    let client = reqwest::Client::new();
    let response = client.get(&url).header("apikey", supabase_key).header("Authorization", format!("Bearer {}", supabase_key)).send().await.map_err(|e| e.to_string())?;
    let daily_prices: Vec<SupabasePrice> = response.json().await.map_err(|e| e.to_string())?;
    
    let raw_prices = aggregate_data(daily_prices, &timeframe);
    
    Ok(raw_prices.into_iter().map(|p| UiPricePoint { 
        date: p.date, 
        open: p.open.to_f64().unwrap_or(0.0),
        high: p.high.to_f64().unwrap_or(0.0),
        low: p.low.to_f64().unwrap_or(0.0),
        close: p.close.to_f64().unwrap_or(0.0),
        equity: 0.0,
        trade: None 
    }).collect())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .invoke_handler(tauri::generate_handler![run_simulation, get_market_data, run_monte_carlo])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
