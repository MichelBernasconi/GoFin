import backtrader as bt

class RSIStrategy(bt.Strategy):
    params = (
        ('rsi_period', 14),
        ('rsi_upper', 70),
        ('rsi_lower', 30),
    )

    def __init__(self):
        self.rsi = bt.indicators.RelativeStrengthIndex(period=self.p.rsi_period)

    def next(self):
        if not self.position:
            if self.rsi < self.p.rsi_lower:
                self.buy()
        else:
            if self.rsi > self.p.rsi_upper:
                self.sell()
