import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { 
  TrendingUp, Activity, Code2, Globe, LayoutDashboard, Library, Plus, Trash2, Save, Calendar, Database, 
  Brain, Bell, AlertTriangle, Zap, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formatCurrency = (v, curr = 'USD') => {
  if (curr === 'BTC') return `₿${v.toFixed(4)}`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: curr }).format(v);
};

const TEMPLATES = {
  json: JSON.stringify({
    name: "JSON Default Strategy",
    entry_rules: [{ left: { SMA: 50 }, operator: "CrossesOver", right: "Price" }],
    exit_rules: [{ left: { RSI: 14 }, operator: "GreaterThan", right: { Value: "70" } }]
  }, null, 2),
  
  python: `def on_data(portfolio, market):
    # Quantara Python Engine
    btc_id = "1"
    btc_price = float(market.get(btc_id, {}).get("price", 0))
    if btc_price > 50000:
        return f"BUY:{btc_id}"
    elif btc_price < 40000:
        return f"SELL:{btc_id}"
    return "HOLD"
    
signal = on_data(portfolio, market)`,

  rust: `use quantara::prelude::*;
pub fn on_bar(context: &mut Context) -> Signal {
    let price = context.current_price();
    let sma = context.calculate_sma(20);
    if price > sma { Signal::Buy } else { Signal::Sell }
}`
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [backendReady, setBackendReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
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
      { id: '2', name: 'Mean Reversion', lang: 'json', config: JSON.stringify({ entry_rules: [] }, null, 2) },
      { id: '3', name: 'RSI Scalper', lang: 'python', config: TEMPLATES.python }
    ];
    setStrategies(defaultStrats);
    setActiveStrategy(defaultStrats[0]);
    
    const check = () => {
      fetch('http://127.0.0.1:3000/assets').then(() => setBackendReady(true)).catch(() => setBackendReady(false));
    };
    check();
    setInterval(check, 10000);

    setIntelligenceData({
      fearGreed: 65, sentiment: 'Bullish', socialVolume: 'High (+12%)',
      topBuzz: ['#BitcoinEtf', '#FedPivot', '#NvidiaEarnings'],
      aiInsight: "Analysis suggests a strong trend consolidation. Resistance levels at $68k are being tested with high social engagement."
    });

    setMarketEvents([
      { id: '1', time: '14:30', asset: 'USD', name: 'CPI Inflation Data', impact: 'High', status: 'Expected' },
      { id: '2', time: '16:00', asset: 'EUR', name: 'Lagarde Speech', impact: 'Medium', status: 'Scheduled' },
      { id: '3', time: 'Tomorrow', asset: 'ALL', name: 'FOMC Meeting', impact: 'Critical', status: 'Major' },
    ]);
  }, []);

  useEffect(() => {
    localStorage.setItem('gofin_strategies', JSON.stringify(strategies));
    localStorage.setItem('gofin_capital', initialCapital);
    localStorage.setItem('gofin_currency', currency);
  }, [strategies, initialCapital, currency]);

  const addToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const getMockData = () => {
    const activeAssets = assets.filter(a => a.active);
    return {
      total_return: 25.4,
      max_drawdown: -8.5,
      final_value: initialCapital * 1.254,
      trades: [
        { id: '1', day: 'Day 5', asset: activeAssets[0]?.symbol || 'BTC', side: 'BUY', price: 28450, qty: 0.5 },
        { id: '2', day: 'Day 12', asset: activeAssets[0]?.symbol || 'BTC', side: 'SELL', price: 31200, qty: 0.5 }
      ]
    };
  };

  const runBacktest = () => {
    setLoading(true);
    setTimeout(() => {
      const res = getMockData();
      const historyData = Array.from({length: 30}, (_, i) => ({
        date: `2024-01-${i+1}`,
        equity: parseFloat((res.final_value * (0.8 + (i/29)*0.2) * (0.98 + Math.random()*0.04)).toFixed(2))
      }));
      setResult({...res, data: historyData});
      setLoading(false);
      setActiveTab('dashboard');
      addToast('Backtest complete');
    }, 1500);
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
                <h2>Performance Analysis</h2>
                <div className="header-actions">
                  <div className="date-inputs">
                    <div className="input-group">
                      <label>CAPITAL / CURRENCY</label>
                      <div style={{ display: 'flex', gap: '0.2rem' }}>
                        <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ width: '100px' }}>
                          <option value="USD">USD</option><option value="EUR">EUR</option><option value="BTC">BTC</option>
                        </select>
                        <input type="number" value={initialCapital} onChange={e => setInitialCapital(Number(e.target.value))} style={{ width: '100px' }} />
                      </div>
                    </div>
                  </div>
                  <div style={{display: 'flex', gap: '0.8rem', position: 'relative'}}>
                    <button className="secondary-btn" onClick={() => setShowExportMenu(!showExportMenu)}><Database size={16}/> EXPORT</button>
                    <AnimatePresence>
                      {showExportMenu && (
                        <motion.div className="export-dropdown" initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: 10}}>
                          <div className="dropdown-item" onClick={() => setShowExportMenu(false)}><Code2 size={14}/> <span>Strategy Script</span></div>
                          {result && <div className="dropdown-item" onClick={() => setShowExportMenu(false)}><Database size={14}/> <span>CSV Results</span></div>}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <button className="primary-btn" onClick={runBacktest} disabled={loading}>{loading ? 'CRUNCHING...' : 'RUN BACKTEST'}</button>
                  </div>
                </div>
              </header>

              <div className="stats-grid">
                <div className="stat-card"><label>Total Return</label><div className="stat-value" style={{color: 'var(--accent-color)'}}>{result ? `${result.total_return}%` : '--'}</div></div>
                <div className="stat-card"><label>Portfolio Value</label><div className="stat-value">{result ? formatCurrency(result.final_value, currency) : '--'}</div></div>
              </div>
              
              <div className="chart-container" style={{ flex: 1, minHeight: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={result?.data || []}>
                    <defs><linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.3}/><stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis orientation="right" tickFormatter={(v) => formatCurrency(v, currency)} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => formatCurrency(value, currency)} contentStyle={{background: '#121217', border: '1px solid var(--border-color)', borderRadius: '12px'}} />
                    <Area type="monotone" dataKey="equity" stroke="var(--accent-color)" strokeWidth={3} fill="url(#colorEquity)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.section>
          )}

          {activeTab === 'intelligence' && (
            <motion.section key="intelligence" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}}>
              <header className="view-header"><h2>Intelligence Hub</h2><div className="execution-tag">AI Powered</div></header>
              <div className="intelligence-grid">
                <div className="stat-card">
                  <label>Fear & Greed Index</label>
                  <div className="stat-value" style={{color: 'var(--accent-color)'}}>{intelligenceData?.fearGreed} / 100</div>
                  <span style={{fontSize: '0.8rem', opacity: 0.7}}>Sentiment: {intelligenceData?.sentiment}</span>
                </div>
                <div className="insight-card" style={{gridColumn: '1 / -1', background:'rgba(16,185,129,0.05)', border:'1px solid rgba(16,185,129,0.2)', padding:'1.5rem', borderRadius:'16px'}}>
                  <div style={{display:'flex', gap:'0.8rem', alignItems:'center', marginBottom:'1rem'}}><Zap size={20} color="var(--accent-color)"/><h3 style={{margin:0}}>AI Market Insight</h3></div>
                  <p style={{margin:0, lineHeight:1.6, color:'var(--text-secondary)'}}>{intelligenceData?.aiInsight}</p>
                </div>
              </div>
            </motion.section>
          )}

          {activeTab === 'events' && (
            <motion.section key="events" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}}>
              <header className="view-header"><h2>Economic Calendar</h2><button className="secondary-btn"><Calendar size={16}/> Filter</button></header>
              <div className="card-body">
                <table className="trade-table">
                  <thead><tr><th>TIME</th><th>ASSET</th><th>EVENT</th><th>IMPACT</th></tr></thead>
                  <tbody>
                    {marketEvents.map(ev => (
                      <tr key={ev.id}><td>{ev.time}</td><td><code>{ev.asset}</code></td><td><strong>{ev.name}</strong></td><td><span className={`impact-badge ${ev.impact.toLowerCase()}`}>{ev.impact}</span></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.section>
          )}

          {activeTab === 'market' && (
            <motion.section key="market" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}}>
              <header className="view-header"><h2>Market Data</h2></header>
              <div className="card-body">
                <table className="trade-table">
                  <thead><tr><th>ENABLED</th><th>SYMBOL</th><th>NAME</th><th>STATUS</th></tr></thead>
                  <tbody>
                    {assets.map(a => (
                      <tr key={a.id}><td><input type="checkbox" checked={a.active} onChange={() => {}} /></td><td><code>{a.symbol}</code></td><td>{a.name}</td><td><span className="badge">{a.active ? 'ACTIVE' : 'OFF'}</span></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.section>
          )}

          {activeTab === 'ide' && (
            <motion.section key="ide" initial={{opacity:0}} animate={{opacity:1}} style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
              <header className="view-header"><input className="transparent-title" value={activeStrategy.name} onChange={() => {}} /><div style={{display:'flex', gap:'0.5rem'}}><button className="primary-btn"><Save size={16}/> Save</button></div></header>
              <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <Editor height="100%" language={activeStrategy.lang} theme="vs-dark" value={activeStrategy.config} options={{minimap:{enabled:false},fontSize:14}} />
              </div>
            </motion.section>
          )}

          {activeTab === 'library' && (
            <motion.section key="library" initial={{opacity:0}} animate={{opacity:1}}>
              <header className="view-header"><h2>Library</h2><button className="primary-btn"><Plus size={16}/> New</button></header>
              <div className="library-grid">
                {strategies.map(s => (
                  <div key={s.id} className="strat-card-v2" onClick={() => { setActiveStrategy(s); setActiveTab('ide'); }}>
                    <div className="strat-header"><h3>{s.name}</h3><span className="badge">{s.lang.toUpperCase()}</span></div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {loading && (
            <motion.div key="loading" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="view-content" style={{display:'flex', alignItems:'center', justifyContent:'center'}}>
              <div className="loading-overlay"><div className="loading-bar"></div><div className="crunching-text">Crunching...</div></div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`toast ${t.type}`}>
               <div className="toast-icon">✓</div><div className="toast-msg">{t.msg}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
