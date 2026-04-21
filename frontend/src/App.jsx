import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  TrendingUp, Activity, Code2, Globe, LayoutDashboard, Library, Plus, Trash2, Save, Calendar, Database, 
  Brain, Bell, AlertTriangle, Zap, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';

const formatCurrency = (v, curr = 'USD') => {
  if (curr === 'BTC') return `₿${v.toFixed(4)}`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: curr }).format(v);
};

// --- Templates ---
const TEMPLATES = {
  json: JSON.stringify({
    name: "JSON Default Strategy",
    entry_rules: [{ left: { SMA: 50 }, operator: "CrossesOver", right: "Price" }],
    exit_rules: [{ left: { RSI: 14 }, operator: "GreaterThan", right: { Value: "70" } }]
  }, null, 2),
  
  python: `def on_data(portfolio, market):
    # Quantara Python Engine
    # portfolio: contains 'cash' and 'positions'
    # market: current price points for all assets
    
    btc_id = "1" # Example ID
    btc_price = float(market.get(btc_id, {}).get("price", 0))
    
    if btc_price > 50000:
        return f"BUY:{btc_id}"
    elif btc_price < 40000:
        return f"SELL:{btc_id}"
        
    return "HOLD"

signal = on_data(portfolio, market)`,

  rust: `// Use native Rust types for high performance
use quantara::prelude::*;

pub fn on_bar(context: &mut Context) -> Signal {
    let price = context.current_price();
    let sma = context.calculate_sma(20);
    
    if price > sma {
        Signal::Buy
    } else {
        Signal::Sell
    }
}`
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [backendReady, setBackendReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // --- States ---
  const [strategies, setStrategies] = useState(() => {
    const saved = localStorage.getItem('gofin_strategies');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeStrategy, setActiveStrategy] = useState(null);
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2024-01-01');
  const [initialCapital, setInitialCapital] = useState(() => Number(localStorage.getItem('gofin_capital')) || 10000);
  const [currency, setCurrency] = useState(() => localStorage.getItem('gofin_currency') || 'USD');
  const [toasts, setToasts] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [intelligenceData, setIntelligenceData] = useState(null);
  const [marketEvents, setMarketEvents] = useState([]);
  const [assets, setAssets] = useState([
    { id: '1', symbol: 'BTCUSDT', name: 'Bitcoin', type: 'Crypto', active: true },
    { id: '2', symbol: 'ETHUSDT', name: 'Ethereum', type: 'Crypto', active: true },
    { id: '3', symbol: 'AAPL', name: 'Apple Inc.', type: 'Stock', active: false },
    { id: '4', symbol: 'TSLA', name: 'Tesla', type: 'Stock', active: false },
    { id: '5', symbol: 'GC=F', name: 'Gold Futures', type: 'Commodity', active: false },
  ]);

  useEffect(() => {
    const defaultStrats = [
      { id: '1', name: 'Trend Following', lang: 'json', config: TEMPLATES.json },
      { id: '2', name: 'Mean Reversion', lang: 'json', config: JSON.stringify({
          entry_rules: [{ left: "Price", operator: "LessThan", right: { SMA: 100 } }],
          exit_rules: [{ left: "Price", operator: "GreaterThan", right: { SMA: 20 } }]
        }, null, 2) 
      },
      { id: '3', name: 'RSI Scalper', lang: 'python', config: TEMPLATES.python }
    ];
    
    invoke('get_saved_strategies').then(res => {
      try {
        const list = JSON.parse(res);
        if (list && list.length > 0) {
          setStrategies([...defaultStrats, ...list]);
          setActiveStrategy(defaultStrats[0]);
        } else {
          setStrategies(defaultStrats);
          setActiveStrategy(defaultStrats[0]);
        }
      } catch(e) {
        setStrategies(defaultStrats);
        setActiveStrategy(defaultStrats[0]);
      }
    }).catch(() => {
      setStrategies(defaultStrats);
      setActiveStrategy(defaultStrats[0]);
    });
    
    const check = () => {
      fetch('http://127.0.0.1:3000/assets', { method: 'GET' }).then(() => setBackendReady(true)).catch(() => setBackendReady(false));
    };
    check();
    const inv = setInterval(check, 5000);
    return () => clearInterval(inv);
  }, []);

  useEffect(() => {
    localStorage.setItem('gofin_strategies', JSON.stringify(strategies));
  }, [strategies]);

  useEffect(() => {
    // Simuliamo fetch di Intelligence Data
    setIntelligenceData({
      fearGreed: 65, // Greed
      sentiment: 'Bullish',
      socialVolume: 'High (+12%)',
      topBuzz: ['#BitcoinEtf', '#FedPivot', '#NvidiaEarnings'],
      aiInsight: "Analysis suggests a strong trend consolidation. Resistance levels at $68k are being tested with high social engagement."
    });

    // Simuliamo fetch di Market Events
    setMarketEvents([
      { id: '1', time: '14:30', asset: 'USD', name: 'CPI Inflation Data', impact: 'High', status: 'Expected' },
      { id: '2', time: '16:00', asset: 'EUR', name: 'Lagarde Speech', impact: 'Medium', status: 'Scheduled' },
      { id: '3', time: 'Tomorrow', asset: 'ALL', name: 'FOMC Meeting', impact: 'Critical', status: 'Major' },
      { id: '4', time: 'Friday', asset: 'BTC', name: 'Difficulty Adjustment', impact: 'Low', status: 'Scheduled' },
    ]);
  }, []);

  const addToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const toggleAsset = (id) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  const getMockData = () => {
    const activeAssets = assets.filter(a => a.active);
    const activeSymbols = activeAssets.map(a => a.symbol);
    const fallbackSymbol = activeSymbols.length > 0 ? activeSymbols[0] : 'BTCUSDT';
    
    // Calcoliamo un rendimento "finto" ma plausibile basato sul tipo di asset
    // Crypto: +/- 40%, Stocks: +/- 15%, Commodities: +/- 8%
    let totalPotentialReturn = 0;
    activeAssets.forEach(a => {
      if (a.type === 'Crypto') totalPotentialReturn += (15 + Math.random() * 30);
      else if (a.type === 'Stock') totalPotentialReturn += (5 + Math.random() * 15);
      else totalPotentialReturn += (2 + Math.random() * 8);
    });

    const returnPct = activeAssets.length > 0 
      ? (totalPotentialReturn / activeAssets.length).toFixed(2) 
      : (5 + Math.random() * 5).toFixed(2);

    return {
      total_return: parseFloat(returnPct),
      max_drawdown: -(5 + Math.random() * 10).toFixed(1),
      final_value: initialCapital * (1 + parseFloat(returnPct) / 100),
      execution_time: `${Math.floor(100 + Math.random() * 200)}ms (Mock)`,
      trades: [
        { id: '1', day: 'Day 5', asset: activeSymbols[0] || fallbackSymbol, side: 'BUY', price: 28450.00, qty: (initialCapital * 0.5) / 28450.00 },
        { id: '2', day: 'Day 12', asset: activeSymbols[0] || fallbackSymbol, side: 'SELL', price: 31200.00, qty: (initialCapital * 0.5) / 28450.00 },
        { id: '3', day: 'Day 18', asset: activeSymbols[1] || activeSymbols[0] || fallbackSymbol, side: 'BUY', price: 1850.50, qty: (initialCapital * 0.3) / 1850.50 },
        { id: '4', day: 'Day 24', asset: activeSymbols[1] || activeSymbols[0] || fallbackSymbol, side: 'SELL', price: 2100.20, qty: (initialCapital * 0.3) / 1850.50 },
        { id: '5', day: 'Day 28', asset: activeSymbols[2] || activeSymbols[0] || fallbackSymbol, side: 'BUY', price: 175.40, qty: (initialCapital * 0.2) / 175.40 },
      ]
    };
  };

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (payload.trade === 'BUY') return <circle cx={cx} cy={cy} r={6} fill="var(--accent-color)" stroke="#121217" strokeWidth={2} />;
    if (payload.trade === 'SELL') return <circle cx={cx} cy={cy} r={6} fill="var(--danger)" stroke="#121217" strokeWidth={2} />;
    return <circle cx={cx} cy={cy} r={0} />; // Nascosto per i giorni normali
  };

  const exportTrades = () => {
    if (!result || !result.trades) return;
    const headers = ['Day', 'Asset', 'Side', 'Price', 'Quantity'].join(',');
    const rows = result.trades.map(t => `${t.day},${t.asset},${t.side},${t.price},${t.qty}`).join('\n');
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gofin_trades_${Date.now()}.csv`;
    a.click();
    addToast('Trade history exported to CSV');
  };

  const exportStrategy = () => {
    if (!activeStrategy) return;
    const extensions = { python: 'py', rust: 'rs', json: 'json' };
    const ext = extensions[activeStrategy.lang] || 'txt';
    const blob = new Blob([activeStrategy.config], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeStrategy.name.replace(/\s+/g, '_').toLowerCase()}.${ext}`;
    a.click();
    addToast('Strategy script exported');
  };

  const saveStrategy = () => {
    setStrategies(prev => prev.map(s => s.id === activeStrategy.id ? activeStrategy : s));
    addToast('Strategy saved to library');
  };

  const runBacktest = () => {
    setLoading(true);
    setResult(null);
    
    const handleResult = (res) => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) || 30;

      const historyData = Array.from({length: 30}, (_, i) => {
        const isLast = i === 29;
        const currentRef = new Date(start);
        currentRef.setDate(start.getDate() + Math.floor((i / 29) * diffDays));
        const d = currentRef.getDate().toString().padStart(2, '0');
        const m = (currentRef.getMonth() + 1).toString().padStart(2, '0');
        const y = currentRef.getFullYear().toString().slice(-2);
        const dateStr = `${d}/${m}/${y}`;

        // Calcolo deterministico: la curva sale in modo costante verso il valore finale
        // Aggiungiamo una piccola oscillazione "fissa" basata sull'indice per dare realismo senza casualità
        const fixedWiggle = 1.0 + (Math.sin(i * 0.5) * 0.05); 
        const val = isLast ? res.final_value : (res.final_value * (0.8 + (i/29) * 0.2) * fixedWiggle);
        const trade = res.trades.find(t => t.day === `Day ${i + 1}`);

        return { date: dateStr, equity: parseFloat(val.toFixed(2)), trade: trade ? trade.side : null };
      });
      
      setResult({...res, data: historyData});
      setLoading(false);
      setActiveTab('dashboard');
      addToast('Backtest complete');
    };

    invoke('run_simulation', { initialCapital }).then(handleResult).catch(err => {
      addToast('Engine error, using fallback', 'error');
      console.error(err);
      handleResult(getMockData());
    });
  };

  const changeLanguage = (lang) => {
    setActiveStrategy({ ...activeStrategy, lang: lang, config: TEMPLATES[lang] });
  };

  if (!activeStrategy) return null;

  return (
    <div className="app-container">
      <nav className="sidebar">
        <div className="logo"><TrendingUp size={28} color="var(--accent-color)" /><span>GoFin</span></div>
        <div className="nav-links">
          <div className="nav-section-label">SIMULATION ENGINE</div>
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}><LayoutDashboard size={18} /> Dashboard</button>
          <button className={activeTab === 'market' ? 'active' : ''} onClick={() => setActiveTab('market')}><Globe size={18} /> Market Data</button>
          <button className={activeTab === 'ide' ? 'active' : ''} onClick={() => setActiveTab('ide')}><Code2 size={18} /> Strategy Lab</button>
          <button className={activeTab === 'library' ? 'active' : ''} onClick={() => setActiveTab('library')}><Library size={18} /> Library</button>
          
          <div className="nav-section-label" style={{ marginTop: '1.5rem' }}>MARKET INTELLIGENCE</div>
          <button className={activeTab === 'intelligence' ? 'active' : ''} onClick={() => setActiveTab('intelligence')}><Brain size={18} /> Intelligence</button>
          <button className={activeTab === 'events' ? 'active' : ''} onClick={() => setActiveTab('events')}><Bell size={18} /> Events</button>
        </div>
        <div className="engine-status">
          <div className={`status-dot ${backendReady ? 'online' : 'offline'}`} />
          <span>Quantara {backendReady ? 'Ready' : 'Offline'}</span>
        </div>
      </nav>

      <main className="main-content">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.section key="dash" initial={{opacity:0}} animate={{opacity:1}} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <header className="view-header">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <h2>Performance Analysis</h2>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.7rem', opacity: 0.6 }}>ACTIVE STRATEGY:</label>
                    <select 
                      value={activeStrategy.id}
                      onChange={(e) => {
                        const s = strategies.find(x => x.id === e.target.value);
                        if (s) setActiveStrategy(s);
                      }}
                    >
                      {strategies.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.lang.toUpperCase()})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="header-actions">
                  <div className="date-inputs">
                    <div className="input-group">
                      <label>CAPITAL</label>
                      <div style={{ display: 'flex', gap: '0.2rem' }}>
                        <select 
                          value={currency} 
                          onChange={(e) => setCurrency(e.target.value)}
                          style={{ width: '100px', padding: '4px' }}
                        >
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="BTC">BTC</option>
                        </select>
                        <input type="number" value={initialCapital} onChange={e => setInitialCapital(Number(e.target.value))} style={{ width: '90px' }} />
                      </div>
                    </div>
                    <div className="input-group">
                      <label>PERIOD</label>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        <span style={{color: 'var(--text-secondary)'}}>to</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                      </div>
                    </div>
                  </div>
                  <div style={{display: 'flex', gap: '0.8rem', position: 'relative'}}>
                    <button className="secondary-btn" onClick={() => setShowExportMenu(!showExportMenu)}>
                      <Database size={16}/> EXPORT
                    </button>
                    <AnimatePresence>
                      {showExportMenu && (
                        <motion.div 
                          className="export-dropdown"
                          initial={{opacity: 0, y: 10}}
                          animate={{opacity: 1, y: 0}}
                          exit={{opacity: 0, y: 10}}
                        >
                          <div className="dropdown-item" onClick={() => { exportStrategy(); setShowExportMenu(false); }}>
                            <Code2 size={14}/> <span>Strategy Script (.py, .rs)</span>
                          </div>
                          {result && (
                            <div className="dropdown-item" onClick={() => { exportTrades(); setShowExportMenu(false); }}>
                              <Database size={14}/> <span>Simulation Results (CSV)</span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <button className="primary-btn" onClick={runBacktest} disabled={loading}>{loading ? 'CRUNCHING...' : 'RUN BACKTEST'}</button>
                  </div>
                </div>
              </header>

              <div className="stats-grid" style={{ marginBottom: '1rem' }}>
                <div className="stat-card"><label>Total Return</label><div className="stat-value" style={{color: 'var(--accent-color)'}}>{result ? `${result.total_return}%` : '--'}</div></div>
                <div className="stat-card"><label>Portfolio Value</label><div className="stat-value">{result ? formatCurrency(result.final_value, currency) : '--'}</div></div>
                <div className="stat-card"><label>Max Drawdown</label><div className="stat-value" style={{color: 'var(--danger)'}}>{result ? `${result.max_drawdown}%` : '--'}</div></div>
              </div>
              <div className="chart-container" style={{flex: 1, minHeight: '450px'}}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={result?.data || []} margin={{ bottom: 60, left: 10, right: 30 }}>
                    <defs><linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.3}/><stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{fill: '#475569', fontSize: 10, angle: 45, textAnchor: 'start'}} 
                      axisLine={false} 
                      tickLine={false}
                      interval={0}
                      height={60}
                      padding={{ left: 10, right: 10 }}
                    />
                    <YAxis orientation="right" tick={{fill: '#475569', fontSize: 11}} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v, currency)} />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value, currency)}
                      contentStyle={{background: '#121217', border: '1px solid var(--border-color)', borderRadius: '12px'}} 
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36}
                      payload={[
                        { value: 'Portfolio Equity', type: 'line', id: 'ID01', color: 'var(--accent-color)' },
                        { value: 'BUY Signal', type: 'circle', id: 'ID02', color: 'var(--accent-color)' },
                        { value: 'SELL Signal', type: 'circle', id: 'ID03', color: 'var(--danger)' }
                      ]}
                    />
                    <Area 
                      name="Portfolio Equity"
                      type="monotone" 
                      dataKey="equity" 
                      stroke="var(--accent-color)" 
                      strokeWidth={3} 
                      fill="url(#colorEquity)" 
                      dot={<CustomDot />}
                      activeDot={{ r: 8, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {result?.trades && (
                <div className="trade-history-section">
                  <header className="section-header">
                    <h3>Recent Trades</h3>
                    <span className="badge">{result.trades.length} Operations</span>
                  </header>
                  <div className="table-container">
                    <table className="trade-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Asset</th>
                          <th>Side</th>
                          <th>Price</th>
                          <th>Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.trades.map(t => (
                          <tr key={t.id}>
                            <td>{t.day}</td>
                            <td><strong>{t.asset}</strong></td>
                            <td>
                              <span className={`side-badge ${t.side.toLowerCase()}`}>
                                {t.side}
                              </span>
                            </td>
                            <td>{formatCurrency(t.price, currency)}</td>
                            <td>{t.qty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.section>
          )}

          {activeTab === 'market' && (
            <motion.section key="market" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}}>
              <header className="view-header">
                <h2>Market Assets</h2>
                <button className="secondary-btn"><Plus size={16}/> Connect Data</button>
              </header>
              <div className="card-body" style={{flex: 1, overflow: 'auto', padding: 0}}>
                <table className="trade-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>ENABLED</th>
                      <th>SYMBOL</th>
                      <th>ASSET NAME</th>
                      <th>CATEGORY</th>
                      <th>CONNECTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map(asset => (
                      <tr key={asset.id} style={{ opacity: asset.active ? 1 : 0.4, transition: 'opacity 0.2s' }}>
                        <td style={{ textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={asset.active} 
                            onChange={() => toggleAsset(asset.id)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-color)' }}
                          />
                        </td>
                        <td><code style={{color: 'var(--accent-color)', fontWeight: 'bold'}}>{asset.symbol}</code></td>
                        <td>{asset.name}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{asset.type}</td>
                        <td>
                          <span style={{ 
                            fontSize: '0.7rem', 
                            padding: '4px 10px', 
                            borderRadius: '20px',
                            background: asset.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                            color: asset.active ? 'var(--accent-color)' : 'var(--text-secondary)',
                            fontWeight: '600'
                          }}>
                            {asset.active ? 'ACTIVE' : 'DISABLED'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.section>
          )}

          {loading && (
            <motion.div key="loading" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="view-content" style={{display:'flex', alignItems:'center', justifyContent:'center'}}>
              <div className="loading-overlay">
                <div className="loading-bar"></div>
                <div className="crunching-text">Crunching Market Data...</div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ide' && (
            <motion.section key="ide" initial={{opacity:0}} animate={{opacity:1}} style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
              <header className="view-header">
                <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                  <input className="transparent-title" value={activeStrategy.name} onChange={e => setActiveStrategy({...activeStrategy, name: e.target.value})} />
                  <div className="lang-selector">
                    {['json','python','rust'].map(l => (
                      <button key={l} className={activeStrategy.lang === l ? 'active' : ''} onClick={() => changeLanguage(l)}>{l.toUpperCase()}</button>
                    ))}
                  </div>
                </div>
                <div style={{display: 'flex', gap: '0.8rem'}}>
                  <button className="secondary-btn" onClick={exportStrategy} title="Download Source"><Database size={16}/></button>
                  <button className="primary-btn" onClick={saveStrategy}><Save size={16}/> Save Strategy</button>
                </div>
              </header>
              <div style={{flex: 1, borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)'}}>
                <Editor height="100%" language={activeStrategy.lang === 'rust' ? 'rust' : (activeStrategy.lang === 'python' ? 'python' : 'json')} theme="vs-dark" value={activeStrategy.config} onChange={(val) => setActiveStrategy({...activeStrategy, config: val})} options={{minimap:{enabled:false},fontSize:14,padding:{top:20},fontWeight:'500'}} />
              </div>
            </motion.section>
          )}

          {activeTab === 'intelligence' && (
            <motion.section key="intelligence" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}}>
              <header className="view-header"><h2>Intelligence Hub</h2><div className="execution-tag">AI Powered</div></header>
              <div className="intelligence-grid">
                <div className="stat-card">
                  <label>Fear & Greed Index</label>
                  <div className="stat-value" style={{color: intelligenceData?.fearGreed > 50 ? 'var(--accent-color)' : 'var(--danger)'}}>
                    {intelligenceData?.fearGreed} / 100
                  </div>
                  <span style={{fontSize: '0.8rem', opacity: 0.7}}>Market Sentiment: {intelligenceData?.sentiment}</span>
                </div>
                <div className="stat-card">
                  <label>Social Pulse</label>
                  <div className="stat-value">{intelligenceData?.socialVolume}</div>
                  <div style={{display:'flex', gap:'0.5rem', marginTop:'0.5rem'}}>
                    {intelligenceData?.topBuzz.map(tag => <span key={tag} className="badge" style={{fontSize:'0.6rem'}}>{tag}</span>)}
                  </div>
                </div>
                <div className="insight-card" style={{gridColumn: '1 / -1', background:'rgba(16,185,129,0.05)', border:'1px solid rgba(16,185,129,0.2)', padding:'1.5rem', borderRadius:'16px'}}>
                  <div style={{display:'flex', gap:'0.8rem', alignItems:'center', marginBottom:'1rem'}}>
                    <Zap size={20} color="var(--accent-color)"/>
                    <h3 style={{margin:0}}>AI Market Insight</h3>
                  </div>
                  <p style={{margin:0, lineHeight:1.6, color:'var(--text-secondary)'}}>{intelligenceData?.aiInsight}</p>
                </div>
              </div>
            </motion.section>
          )}

          {activeTab === 'events' && (
            <motion.section key="events" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}}>
              <header className="view-header"><h2>Economic Calendar</h2><button className="secondary-btn"><Calendar size={16}/> Filter Events</button></header>
              <div className="card-body" style={{flex: 1, padding: 0}}>
                <table className="trade-table">
                  <thead>
                    <tr>
                      <th>TIME</th>
                      <th>ASSET</th>
                      <th>EVENT</th>
                      <th>IMPACT</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketEvents.map(ev => (
                      <tr key={ev.id}>
                        <td>{ev.time}</td>
                        <td><code style={{color: 'var(--accent-color)'}}>{ev.asset}</code></td>
                        <td><strong>{ev.name}</strong></td>
                        <td>
                          <span className={`impact-badge ${ev.impact.toLowerCase()}`}>
                            {ev.impact}
                          </span>
                        </td>
                        <td style={{fontSize:'0.8rem', opacity:0.6}}>{ev.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.section>
          )}

          {activeTab === 'library' && (
            <motion.section key="library" initial={{opacity:0}} animate={{opacity:1}}>
              <header className="view-header"><h2>Your Library</h2><button className="primary-btn" onClick={() => {
                const ns = { id: Date.now().toString(), name: "New Strategy", lang: 'json', config: TEMPLATES.json };
                setStrategies([...strategies, ns]); setActiveStrategy(ns); setActiveTab('ide');
              }}><Plus size={16}/> Create New</button></header>
              <div className="library-grid">
                {strategies.map(s => (
                  <div key={s.id} className="strat-card-v2">
                    <div className="strat-header"><h3>{s.name}</h3>
                      <div className="strat-actions">
                        <button onClick={() => { setActiveStrategy(s); setActiveTab('ide'); }}>Edit</button>
                        <button className="delete" onClick={() => setStrategies(strategies.filter(x => x.id !== s.id))}><Trash2 size={16}/></button>
                      </div>
                    </div>
                    <div className="strat-preview">{s.lang.toUpperCase()} • {s.config.length} bytes</div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {toasts.map(t => (
            <motion.div 
              key={t.id} 
              initial={{ opacity: 0, y: 50, scale: 0.9 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className={`toast ${t.type}`}
            >
              <div className="toast-icon">{t.type === 'success' ? '✓' : '⚠'}</div>
              <div className="toast-msg">{t.msg}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
