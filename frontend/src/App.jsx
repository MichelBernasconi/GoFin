import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Bar, Cell, Line } from 'recharts';
import { 
  TrendingUp, Activity, Code2, Globe, LayoutDashboard, Library, Plus, Trash2, Save, Calendar, Database, 
  Brain, Bell, AlertTriangle, Zap, MessageSquare, Download, Edit3, CheckCircle2, XCircle,
  CandlestickChart, BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';

// --- Utility ---
const formatCurrency = (v, curr = 'USD') => {
  if (v === undefined || v === null || isNaN(v)) return '$...';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: curr }).format(v);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const CustomTooltip = ({ active, payload, label, currency, isLog }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isUp = data.close >= data.open;
    return (
      <div className="custom-tooltip neon-box" style={{ 
        padding: '12px 16px', 
        background: 'rgba(18, 18, 23, 0.9)', 
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.4)'
      }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 800 }}>
          {formatDate(data.date)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
          <div className="tooltip-item"><label style={{fontSize:9, color:'var(--text-muted)', display:'block'}}>OPEN</label><span style={{fontSize:11, fontWeight:700}}>{formatCurrency(data.open, currency)}</span></div>
          <div className="tooltip-item"><label style={{fontSize:9, color:'var(--text-muted)', display:'block'}}>HIGH</label><span style={{fontSize:11, fontWeight:700, color:'var(--accent-color)'}}>{formatCurrency(data.high, currency)}</span></div>
          <div className="tooltip-item"><label style={{fontSize:9, color:'var(--text-muted)', display:'block'}}>LOW</label><span style={{fontSize:11, fontWeight:700, color:'var(--danger)'}}>{formatCurrency(data.low, currency)}</span></div>
          <div className="tooltip-item"><label style={{fontSize:9, color:'var(--text-muted)', display:'block'}}>CLOSE</label><span style={{fontSize:11, fontWeight:700, color: isUp ? 'var(--accent-color)' : 'var(--danger)'}}>{formatCurrency(data.close, currency)}</span></div>
        </div>
        {data.trade && (
          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: data.trade === 'BUY' ? 'var(--accent-color)' : 'var(--danger)' }} />
            <span style={{ fontSize: 10, fontWeight: 900, color: data.trade === 'BUY' ? 'var(--accent-color)' : 'var(--danger)' }}>{data.trade} SIGNAL</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const INITIAL_ASSETS = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 185.92, change: '+1.2%', enabled: true },
  { symbol: 'MSFT', name: 'Microsoft', price: 420.55, change: '+0.8%', enabled: true },
  { symbol: 'NVDA', name: 'Nvidia', price: 890.12, change: '+3.5%', enabled: true },
  { symbol: 'TSLA', name: 'Tesla', price: 175.40, change: '-2.1%', enabled: true },
  { symbol: 'BTC-USD', name: 'Bitcoin', price: 64200.00, change: '+0.5%', enabled: true },
  { symbol: 'ETH-USD', name: 'Ethereum', price: 3450.00, change: '+1.1%', enabled: true },
  { symbol: 'AMZN', name: 'Amazon', price: 178.20, change: '+0.4%', enabled: false },
  { symbol: 'GOOGL', name: 'Google', price: 152.30, change: '-0.2%', enabled: false }
];

const INITIAL_STRATEGIES = [
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
  },
  { 
    id: 'mr', 
    name: 'Statistical Arbitrage', 
    lang: 'json', 
    code: `{\n  "strategy_name": "StatArb",\n  "parameters": {\n    "pair_a": "AAPL",\n    "pair_b": "MSFT",\n    "entry_zscore": 2.0,\n    "exit_zscore": 0.5\n  }\n}`, 
    enabled: false 
  }
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [marketData, setMarketData] = useState([]);
  const [toasts, setToasts] = useState([]);
  
  // STATO PERSISTENTE (Asset e Strategie)
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [strategies, setStrategies] = useState(INITIAL_STRATEGIES);
  
  const [currency, setCurrency] = useState('USD');
  const [capital, setCapital] = useState(10000);
  const [start, setStart] = useState('2023-01-01');
  const [end, setEnd] = useState('2024-01-01');

  const [chartType, setChartType] = useState('area'); // 'area' | 'candle'
  const [isLog, setIsLog] = useState(false);
  const [timeframe, setTimeframe] = useState('1D'); // '1D', '1W', '1M', '1Y'
  const [showBenchmark, setShowBenchmark] = useState(true);
  const [monteCarloResults, setMonteCarloResults] = useState(null);

  // Selezione per Dashboard (Filtra solo quelli abilitati)
  const enabledAssets = assets.filter(a => a.enabled);
  const enabledStrategies = strategies.filter(s => s.enabled);
  
  const [selectedAsset, setSelectedAsset] = useState(enabledAssets[0]?.symbol || 'AAPL');
  const [activeStrategy, setActiveStrategy] = useState(enabledStrategies[0] || strategies[0]);

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const data = await invoke('get_market_data', { symbol: selectedAsset, start, end, timeframe });
        setMarketData(data);
      } catch(e) { console.error(e); }
    };
    fetchMarket();
  }, [selectedAsset, start, end, timeframe]);

  const runBacktest = async () => {
    setLoading(true);
    setMonteCarloResults(null);
    try {
      const res = await invoke('run_simulation', { 
        initialCapital: capital, startDate: start, endDate: end, symbol: selectedAsset, strategyId: activeStrategy.id, timeframe 
      });
      setResults(res);
      addToast(`Test completato con successo.`);
    } catch (err) { addToast('Errore: ' + err, 'error'); } 
    finally { setLoading(false); }
  };

  const runMonteCarlo = async () => {
    setLoading(true);
    try {
      const res = await invoke('run_monte_carlo', { initialCapital: capital, symbol: selectedAsset, timeframe });
      setMonteCarloResults(res);
      addToast(`Simulazione Monte Carlo completata.`);
    } catch (err) { addToast('Errore: ' + err, 'error'); }
    finally { setLoading(false); }
  };

  const toggleAsset = (symbol) => {
    setAssets(prev => prev.map(a => a.symbol === symbol ? { ...a, enabled: !a.enabled } : a));
  };

  const toggleStrategy = (id) => {
    setStrategies(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const addToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const getLangColor = (lang) => {
    if (lang === 'rust') return '#f74c00';
    if (lang === 'python') return '#3776ab';
    return '#f1e05a'; // json/yellow
  };

  return (
    <div className="app-container">
      <nav className="sidebar">
        <div className="logo"><TrendingUp size={28} color="var(--accent-color)" /><span>GoFin</span></div>
        <div className="nav-links">
          <div className="nav-section-label">MARKET</div>
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}><LayoutDashboard size={18} /> Dashboard</button>
          <button className={activeTab === 'market' ? 'active' : ''} onClick={() => setActiveTab('market')}><Globe size={18} /> Market Data</button>
          <div className="nav-section-label">QUANT</div>
          <button className={activeTab === 'ide' ? 'active' : ''} onClick={() => setActiveTab('ide')}><Code2 size={18} /> Strategy Lab</button>
          <button className={activeTab === 'library' ? 'active' : ''} onClick={() => setActiveTab('library')}><Library size={18} /> Library</button>
        </div>
      </nav>

      <main className="main-content">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.section key="dash" initial={{opacity:0}} animate={{opacity:1}}>
              <header className="view-header">
                <div>
                  <h2 style={{margin:0}}>Deep Dashboard</h2>
                  <div className="sub-header-selectors">
                    <select value={activeStrategy.id} onChange={e => setActiveStrategy(strategies.find(s=>s.id===e.target.value))}>
                      {enabledStrategies.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                    </select>
                    <span className="dot-separator">•</span>
                    <select value={selectedAsset} onChange={e => setSelectedAsset(e.target.value)}>
                      {enabledAssets.map(a => <option key={a.symbol} value={a.symbol}>{a.name}</option>)}
                    </select>
                  </div>
                </div>
                
                <div className="header-actions">
                  <div className="params-group">
                    <div className="param-item"><label>CCY</label><select value={currency} onChange={e => setCurrency(e.target.value)}><option>USD</option><option>EUR</option></select></div>
                    <div className="param-item"><label>CAPITAL</label><input type="number" value={capital} onChange={e => setCapital(Number(e.target.value))} /></div>
                    <div className="param-item"><label>PERIOD</label><div className="date-range"><input type="date" value={start} onChange={e => setStart(e.target.value)}/><input type="date" value={end} onChange={e => setEnd(e.target.value)}/></div></div>
                  </div>
                  
                  <div style={{display:'flex', gap:10}}>
                    <button className="primary-btn secondary" onClick={runMonteCarlo} disabled={loading || !results}>MONTE CARLO</button>
                    <button className="primary-btn" onClick={runBacktest} disabled={loading}>RUN TEST</button>
                  </div>
                </div>
              </header>

              <div className="stats-header-grid">
                <div className="stat-card"><label>Algorithm Return</label><div className={`value ${(!results || results.total_return >= 0) ? 'plus' : 'minus'}`}>{results ? results.total_return.toFixed(2) : '---'}%</div></div>
                <div className="stat-card"><label>Benchmark (B&H)</label><div className={`value ${(!results || results.benchmark_return >= 0) ? 'plus' : 'minus'}`}>{results ? results.benchmark_return.toFixed(2) : '---'}%</div></div>
                <div className="stat-card"><label>Current Equity</label><div className="value big">{formatCurrency(results ? results.final_value : capital, currency)}</div></div>
                <div className="stat-card"><label>Max Drawdown</label><div className="value minus">{results ? results.max_drawdown.toFixed(2) : '---'}%</div></div>
              </div>

              <div className="neon-box chart-container" style={{height: 480, marginTop: '2rem', position: 'relative'}}>
                <div className="chart-controls-overlay" style={{
                  position:'absolute', top:20, right:20, zIndex:10, display:'flex', gap:12, alignItems:'center'
                }}>
                  <div className="timeframe-group" style={{display:'flex', background:'rgba(255,255,255,0.04)', padding:4, borderRadius:12, gap:2, border:'1px solid var(--border-color)'}}>
                    {['1D', '1W', '1M', '1Y'].map(tf => (
                      <button 
                        key={tf}
                        className={`tf-btn ${timeframe === tf ? 'active' : ''}`}
                        onClick={() => setTimeframe(tf)}
                        style={{
                          background: timeframe === tf ? 'var(--accent-color)' : 'transparent',
                          color: timeframe === tf ? '#000' : 'var(--text-muted)',
                          border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 10, fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s'
                        }}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>                    <div className="view-toggles" style={{display:'flex', gap:6}}>
                      <button 
                        className={`icon-btn small ${showBenchmark ? 'active-toggle' : ''}`} 
                        onClick={() => setShowBenchmark(!showBenchmark)}
                        title="Toggle Benchmark Line"
                        style={{padding:8, minWidth:40}}
                      >
                        <span style={{fontSize:9, fontWeight:900}}>BENCH</span>
                      </button>
                      <button 
                        className={`icon-btn small ${chartType === 'candle' ? 'active-toggle' : ''}`} 
                        onClick={() => {
                          const next = chartType === 'area' ? 'candle' : 'area';
                          setChartType(next);
                          if (next === 'candle') setIsLog(false);
                        }}
                        title="Toggle Candlestick"
                        style={{padding:8}}
                      >
                        {chartType === 'area' ? <CandlestickChart size={16} /> : <Activity size={16} />}
                      </button>
                      <button 
                        className={`icon-btn small ${isLog ? 'active-toggle' : ''}`} 
                        onClick={() => setIsLog(!isLog)}
                        disabled={chartType === 'candle'}
                        title={chartType === 'candle' ? "Log scale disabled for Candles" : "Toggle Logarithmic Scale"}
                        style={{padding:8, minWidth:40, opacity: chartType === 'candle' ? 0.4 : 1, cursor: chartType === 'candle' ? 'not-allowed' : 'pointer'}}
                      >
                        <span style={{fontSize:10, fontWeight:900}}>{isLog ? 'LOG' : 'LIN'}</span>
                      </button>
                    </div>
                </div>

                <div className="chart-legend" style={{display:'flex', gap:20, marginBottom:20, fontSize:11, color:'var(--text-muted)'}}>
                    <div style={{display:'flex', alignItems:'center', gap:5}}><span style={{width:10, height:2, background:'var(--accent-color)'}}/> Market Price</div>
                    <div style={{display:'flex', alignItems:'center', gap:5}}><span style={{width:8, height:8, background:'var(--accent-color)', borderRadius:'50%'}}/> BUY</div>
                    <div style={{display:'flex', alignItems:'center', gap:5}}><span style={{width:8, height:8, background:'var(--danger)', borderRadius:'50%'}}/> SELL</div>
                </div>
                <ResponsiveContainer width="100%" height="90%">
                  <ComposedChart 
                    key={`market-${chartType}-${timeframe}-${isLog}`}
                    data={(results ? results.data_points : marketData).map((d, idx, arr) => {
                      const first = arr[0].close;
                      const last = arr[arr.length - 1].close;
                      let _benchPrice = null;
                      if (idx === 0) _benchPrice = isLog ? Math.log10(first) : first;
                      if (idx === arr.length - 1) _benchPrice = isLog ? Math.log10(last) : last;

                      return {
                        ...d,
                        _close: isLog ? Math.log10(Math.max(0.01, d.close)) : d.close,
                        _benchPrice,
                        _wick: [
                          isLog ? Math.log10(Math.max(0.01, d.low)) : d.low,
                          isLog ? Math.log10(Math.max(0.01, d.high)) : d.high
                        ],
                        _body: [
                          isLog ? Math.log10(Math.max(0.01, d.open)) : d.open,
                          isLog ? Math.log10(Math.max(0.01, d.close)) : d.close
                        ]
                      };
                    })}>
                    <defs><linearGradient id="p" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.15}/><stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false}/>
                    <XAxis dataKey="date" hide />
                    <YAxis 
                      orientation="right" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill:'#475569', fontSize:10}} 
                      tickFormatter={v => formatCurrency(isLog ? Math.pow(10, v) : v, currency)}
                      domain={['dataMin', 'dataMax']}
                    />
                    <Tooltip content={<CustomTooltip currency={currency} isLog={isLog} />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                    
                    {showBenchmark && (
                      <Line type="monotone" dataKey="_benchPrice" stroke="rgba(255,255,255,0.3)" strokeDasharray="5 5" connectNulls dot={false} strokeWidth={1} />
                    )}

                    {chartType === 'area' ? (
                      <Area type="monotone" dataKey="_close" stroke="var(--accent-color)" strokeWidth={2.5} fill="url(#p)" baseValue="dataMin" dot={(props) => {
                          const { cx, cy, payload } = props;
                          if (payload.trade === 'BUY') return <circle cx={cx} cy={cy} r={6} fill="var(--accent-color)" stroke="#fff" strokeWidth={2} />;
                          if (payload.trade === 'SELL') return <circle cx={cx} cy={cy} r={6} fill="var(--danger)" stroke="#fff" strokeWidth={2} />;
                          return null;
                      }} />
                    ) : (
                      <>
                        <Bar dataKey="_wick" barSize={2} fill="#64748b" />
                        <Bar dataKey="_body" barSize={8}>
                          {(results ? results.data_points : marketData).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.close >= entry.open ? 'var(--accent-color)' : 'var(--danger)'} />
                          ))}
                        </Bar>
                      </>
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {(results || marketData.length > 0) && (
                <div className="neon-box chart-container" style={{height: 280, marginTop: '2rem'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                    <h3 style={{margin:0, fontSize:14, color:'var(--text-muted)'}}>Performance Analysis (vs Buy & Hold)</h3>
                    <div style={{display:'flex', gap:15, fontSize:10, fontWeight:800}}>
                      {results && <div style={{color:'var(--accent-color)'}}>● STRATEGY EQUITY</div>}
                      <div style={{color:'rgba(255,255,255,0.4)'}}>-- BENCHMARK (B&H)</div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height="80%">
                    <AreaChart data={(results ? results.data_points : marketData).map((d, idx, arr) => {
                      const first = arr[0].close;
                      const last = arr[arr.length - 1].close;
                      const b_ret = ((last - first) / first);
                      
                      const initialBench = capital;
                      const finalBench = capital * (1 + b_ret);
                      
                      let _bench = null;
                      if (idx === 0) _bench = initialBench;
                      if (idx === arr.length - 1) _bench = finalBench;
                      return { ...d, _bench };
                    })}>
                      <defs><linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.2}/><stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false}/>
                      <XAxis dataKey="date" hide />
                      <YAxis orientation="right" axisLine={false} tickLine={false} tick={{fill:'#475569', fontSize:10}} tickFormatter={v => formatCurrency(v, currency)} domain={['dataMin', 'dataMax']} />
                      <Tooltip content={<CustomTooltip currency={currency} isLog={false} />} />
                      {results && <Area type="monotone" dataKey="equity" stroke="var(--accent-color)" fill="url(#eqGrad)" strokeWidth={2} />}
                      {showBenchmark && (
                         <Line type="monotone" dataKey="_bench" stroke="rgba(255,255,255,0.3)" strokeDasharray="5 5" connectNulls dot={false} strokeWidth={1} />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {monteCarloResults && (
                <div className="neon-box" style={{marginTop:'2rem'}}>
                  <h3>Monte Carlo Analysis (50 Runs)</h3>
                  <p style={{fontSize:12, color:'var(--text-muted)'}}>Distribution of potential equity outcomes based on randomized market volatility.</p>
                  <div style={{display:'flex', flexWrap:'wrap', gap:8, marginTop:15}}>
                    {monteCarloResults.sort((a,b)=>b-a).map((r, i) => (
                      <div key={i} style={{
                        padding:'4px 8px', background:'rgba(255,255,255,0.05)', borderRadius:6, fontSize:10, 
                        borderLeft: `3px solid ${r >= capital ? 'var(--accent-color)' : 'var(--danger)'}`
                      }}>
                        {formatCurrency(r, currency)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results?.trades && (
                <div className="neon-box" style={{marginTop:'2rem'}}>
                  <h3>Transaction History</h3>
                  <table className="trade-table" style={{marginTop:'1rem'}}>
                    <thead><tr><th>DATE</th><th>SIDE</th><th>PRICE</th><th>QTY</th><th>TOTAL</th><th>PNL</th></tr></thead>
                    <tbody>
                      {results.trades.map(t => (
                        <tr key={t.id}>
                          <td>{formatDate(t.date)}</td>
                          <td><span style={{color: t.side === 'BUY' ? 'var(--accent-color)' : 'var(--danger)', fontWeight:800}}>{t.side}</span></td>
                          <td>{formatCurrency(t.price, currency)}</td>
                          <td style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>{t.qty.toFixed(2)}</td>
                          <td style={{fontWeight:600}}>{formatCurrency(t.total, currency)}</td>
                          <td style={{color: (t.pnl || 0) >= 0 ? 'var(--accent-color)' : 'var(--danger)'}}>{t.pnl ? `${t.pnl > 0 ? '+' : ''}${t.pnl.toFixed(2)}%` : '---'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.section>
          )}

          {activeTab === 'market' && (
            <motion.section key="market" initial={{opacity:0}} animate={{opacity:1}}>
               <header className="view-header"><h2>Market Hub</h2></header>
               <div className="neon-box">
                  <table className="trade-table">
                     <thead><tr><th>DISPLAY</th><th>SYMBOL</th><th>NAME</th><th>LAST PRICE</th><th>CHANGE</th></tr></thead>
                     <tbody>
                        {assets.map(a => (
                           <tr key={a.symbol}>
                              <td><input type="checkbox" checked={a.enabled} onChange={() => toggleAsset(a.symbol)} /></td>
                              <td><strong>{a.symbol}</strong></td><td>{a.name}</td><td>{formatCurrency(a.price, 'USD')}</td>
                              <td style={{color: a.change.startsWith('+') ? 'var(--accent-color)' : 'var(--danger)'}}>{a.change}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </motion.section>
          )}

          {activeTab === 'ide' && (
             <motion.section key="ide" initial={{opacity:0}} animate={{opacity:1}} style={{height:'calc(100vh - 180px)', display:'flex', flexDirection:'column'}}>
                <header className="view-header">
                  <div>
                    <h2>IDE: {activeStrategy.name}</h2>
                    <div className="sub-header-selectors">
                       {['json', 'python', 'rust'].map(l => (
                         <button 
                           key={l}
                           onClick={() => {
                             const updated = { ...activeStrategy, lang: l };
                             setActiveStrategy(updated);
                             setStrategies(prev => prev.map(s => s.id === updated.id ? updated : s));
                           }} 
                           style={{color: activeStrategy.lang === l ? 'var(--accent-color)' : 'var(--text-muted)'}}
                         >
                           {l.toUpperCase()}
                         </button>
                       ))}
                    </div>
                  </div>
                  <div style={{display:'flex', gap:10}}>
                    <button className="icon-btn" onClick={() => addToast('Strategy Exported')} title="Export Strategy"><Download size={16} /></button>
                    <button className="primary-btn"><Save size={16} /> SAVE LOGIC</button>
                  </div>
                </header>
                 <div style={{flex:1, borderRadius:'16px', overflow:'hidden', border:'1px solid var(--border-color)', background:'#1e1e1e'}}>
                  <Editor 
                    theme="vs-dark" 
                    language={activeStrategy.lang} 
                    value={activeStrategy.code}
                    onChange={(val) => {
                      const updated = { ...activeStrategy, code: val };
                      setActiveStrategy(updated);
                      setStrategies(prev => prev.map(s => s.id === updated.id ? updated : s));
                    }}
                    options={{
                      fontSize: 13,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      padding: { top: 20 }
                    }}
                  />
                </div>
             </motion.section>
          )}

          {activeTab === 'library' && (
             <motion.section key="lib" initial={{opacity:0}} animate={{opacity:1}}>
               <header className="view-header"><h2>Local Library</h2></header>
               <div className="stats-header-grid">
                {strategies.map(s => (
                  <div key={s.id} className="stat-card" style={{opacity: s.enabled ? 1 : 0.5}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                       <span style={{fontSize:'0.6rem', padding:'2px 6px', background: getLangColor(s.lang), color:'#000', borderRadius:4, fontWeight:900, textTransform:'uppercase'}}>{s.lang}</span>
                       <input type="checkbox" checked={s.enabled} onChange={() => toggleStrategy(s.id)} />
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10}}>
                      <div className="value">{s.name}</div>
                      <button className="icon-btn" onClick={() => {setActiveStrategy(s); setActiveTab('ide');}}><Edit3 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
             </motion.section>
          )}
        </AnimatePresence>
      </main>

      <div className="toast-container">
        <AnimatePresence>
          {toasts.map(t => (<motion.div key={t.id} initial={{opacity:0, y:50}} animate={{opacity:1, y:0}} exit={{opacity:0}} className={`toast ${t.type}`}>{t.msg}</motion.div>))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
