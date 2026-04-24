export const INITIAL_ASSETS = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 185.92, change: '+1.2%', enabled: true },
  { symbol: 'MSFT', name: 'Microsoft', price: 420.55, change: '+0.8%', enabled: true },
  { symbol: 'NVDA', name: 'Nvidia', price: 890.12, change: '+3.5%', enabled: true },
  { symbol: 'TSLA', name: 'Tesla', price: 175.40, change: '-2.1%', enabled: true },
  { symbol: 'BTC-USD', name: 'Bitcoin', price: 64200.00, change: '+0.5%', enabled: true },
  { symbol: 'ETH-USD', name: 'Ethereum', price: 3450.00, change: '+1.1%', enabled: true },
  { symbol: 'AMZN', name: 'Amazon', price: 178.20, change: '+0.4%', enabled: false },
  { symbol: 'GOOGL', name: 'Google', price: 152.30, change: '-0.2%', enabled: false }
];

export const INITIAL_STRATEGIES = [
  { 
    id: 'sma', 
    name: 'SMA Crossover', 
    lang: 'rust', 
    code: `//! SMA Crossover Strategy\nuse rust_decimal::Decimal;\n\npub struct SMACrossover {\n    pub fast_period: usize,\n    pub slow_period: usize,\n}\n\nimpl SMACrossover {\n    pub fn generate_signal(&self, prices: &[Decimal]) -> Option<&'static str> {\n        let fast_sma = self.calculate_sma(&prices[prices.len() - self.fast_period..]);\n        let slow_sma = self.calculate_sma(&prices[prices.len() - self.slow_period..]);\n        if fast_sma > slow_sma { Some("BUY") } else { Some("SELL") }\n    }\n\n    fn calculate_sma(&self, window: &[Decimal]) -> Decimal {\n        window.iter().sum::<Decimal>() / Decimal::from(window.len())\n    }\n}`, 
    enabled: true 
  },
  { 
    id: 'rsi', 
    name: 'RSI Mean Reversion', 
    lang: 'python', 
    code: `import backtrader as bt\n\nclass RSIStrategy(bt.Strategy):\n    params = (('period', 14), ('upper', 70), ('lower', 30))\n\n    def __init__(self):\n        self.rsi = bt.indicators.RSI(period=self.p.period)\n\n    def next(self):\n        if not self.position and self.rsi < self.p.lower:\n            self.buy()\n        elif self.position and self.rsi > self.p.upper:\n            self.close()`, 
    enabled: true 
  }
];

export const TIMEFRAMES = ['1D', '1W', '1M', '1Y'];
export const LANGUAGES = ['json', 'python', 'rust'];
