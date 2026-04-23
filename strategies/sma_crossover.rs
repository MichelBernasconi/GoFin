//! SMA Crossover Strategy
//! Compatible with Quantara Engine and standard Rust quant frameworks.

use rust_decimal::Decimal;
use rust_decimal_macros::dec;

pub struct SMACrossover {
    pub fast_period: usize,
    pub slow_period: usize,
}

impl SMACrossover {
    pub fn new(fast: usize, slow: usize) -> Self {
        Self { fast_period: fast, slow_period: slow }
    }

    pub fn generate_signal(&self, prices: &[Decimal]) -> Option<&'static str> {
        if prices.len() < self.slow_period {
            return None;
        }

        let fast_sma = self.calculate_sma(&prices[prices.len() - self.fast_period..]);
        let slow_sma = self.calculate_sma(&prices[prices.len() - self.slow_period..]);

        if fast_sma > slow_sma {
            Some("BUY")
        } else if fast_sma < slow_sma {
            Some("SELL")
        } else {
            None
        }
    }

    fn calculate_sma(&self, window: &[Decimal]) -> Decimal {
        let sum: Decimal = window.iter().sum();
        sum / Decimal::from(window.len())
    }
}
