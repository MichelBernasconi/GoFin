import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { 
  TrendingUp, Activity, Play, Server, Zap, ArrowUpRight, ArrowDownRight, 
  Calendar, Code2, Database, LayoutDashboard, Library, Plus, Trash2, Save, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Utility & Mock Data ---
const formatCurrency = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

const DEFAULT_STRATEGY = {
  name: "New Strategy",
  entry_rules: [
    { left: { SMA: 20 }, operator: "CrossesOver", right: "Price" }
  ],
  exit_rules: [
    { left: { RSI: 14 }, operator: "GreaterThan", right: { Value: "70" } }
  ]
};

// --- App Component ---
function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [backendReady, setBackendReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // State for Market Data
  const [assets, setAssets] = useState([
    { id: '1', symbol: 'BTCUTDT', name: 'Bitcoin', type: 'Crypto' },
    { id: '2', symbol: 'ETHUSDT', name: 'Ethereum', type: 'Crypto' },
    { id: '3', symbol: 'AAPL', name: 'Apple Inc.', type: 'Stock' }
  ]);
  const [selectedAsset, setSelectedAsset] = useState('1');

  // State for Strategies
  const [strategies, setStrategies] = useState([
    { id: '1', name: 'Trend Following', config: JSON.stringify(DEFAULT_STRATEGY, null, 2) }
  ]);
  const [activeStrategy, setActiveStrategy] = useState(strategies[0]);

  // Backtest Range
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2024-01-01');

  // Check Backend Status
  useEffect(() => {
    const check = () => {
      fetch('http://127.0.0.1:3000/assets', { method: 'GET' })
        .then(() => setBackendReady(true))
        .catch(() => setBackendReady(false));
    };
    check();
    const inv = setInterval(check, 5000);
    return () => clearInterval(inv);
  }, []);

  const runBacktest = () => {
    setLoading(true);
    // Simulating backtest for now
    setTimeout(() => {
      const data = Array.from({length: 40}, (_, i) => ({
        date: `P${i}`,
        equity: 10000 + (Math.random() * 2000) + (i * 100)
      }));
      setResult({
        total_return: 28.4,
        max_drawdown: -12.2,
        final_value: data[data.length-1].equity,
        data: data
      });
      setActiveTab('dashboard');
      setLoading(false);
    }, 2000);
  };

  const saveStrategy = () => {
    const newStrats = strategies.map(s => s.id === activeStrategy.id ? activeStrategy : s);
    setStrategies(newStrats);
    alert("Strategia salvata con successo!");
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <nav className="sidebar">
        <div className="logo">
          <TrendingUp size={28} color="var(--accent-color)" />
          <span>GoFin</span>
        </div>

        <div className="nav-links">
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button className={activeTab === 'market' ? 'active' : ''} onClick={() => setActiveTab('market')}>
            <Globe size={18} /> Market Data
          </button>
          <button className={activeTab === 'ide' ? 'active' : ''} onClick={() => setActiveTab('ide')}>
            <Code2 size={18} /> Strategy Lab
          </button>
          <button className={activeTab === 'library' ? 'active' : ''} onClick={() => setActiveTab('library')}>
            <Library size={18} /> Library
          </button>
        </div>

        <div className="engine-status">
          <div className={`status-dot ${backendReady ? 'online' : 'offline'}`} />
          <span>Quantara {backendReady ? 'Ready' : 'Offline'}</span>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          
          {/* DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <motion.section key="dash" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <header className="view-header">
                <h2>Performance Analytics</h2>
                <div className="header-actions">
                  <div className="date-inputs">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <span>to</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
                  <button className="primary-btn" onClick={runBacktest} disabled={loading}>
                    {loading ? 'Crunching...' : 'RUN BACKTEST'}
                  </button>
                </div>
              </header>

              <div className="stats-grid">
                <div className="stat-card">
                  <label>Total Return</label>
                  <div className="stat-value" style={{color: 'var(--accent-color)'}}>{result ? `${result.total_return}%` : '--'}</div>
                </div>
                <div className="stat-card">
                  <label>Portfolio Value</label>
                  <div className="stat-value">{result ? formatCurrency(result.final_value) : '--'}</div>
                </div>
                <div className="stat-card">
                  <label>Max Drawdown</label>
                  <div className="stat-value" style={{color: 'var(--danger)'}}>{result ? `${result.max_drawdown}%` : '--'}</div>
                </div>
              </div>

              <div className="chart-container" style={{flex: 1, minHeight: '400px'}}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={result?.data || []}>
                    <defs>
                      <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis orientation="right" tick={{fill: '#475569', fontSize: 11}} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
                    <Tooltip contentStyle={{background: '#121217', border: '1px solid var(--border-color)', borderRadius: '12px'}} />
                    <Area type="monotone" dataKey="equity" stroke="var(--accent-color)" strokeWidth={3} fill="url(#colorEquity)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.section>
          )}

          {/* MARKET DATA VIEW */}
          {activeTab === 'market' && (
            <motion.section key="market" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} className="grid-view">
              <header className="view-header">
                <h2>Market Data Assets</h2>
                <button className="secondary-btn"><Plus size={16}/> Add API Connection</button>
              </header>
              <div className="asset-list">
                {assets.map(asset => (
                  <div key={asset.id} className={`asset-item ${selectedAsset === asset.id ? 'selected' : ''}`} onClick={() => setSelectedAsset(asset.id)}>
                    <div className="asset-icon"><Database size={20}/></div>
                    <div className="asset-info">
                      <strong>{asset.symbol}</strong>
                      <span>{asset.name} • {asset.type}</span>
                    </div>
                    <div className="asset-status">Connected</div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* IDE VIEW */}
          {activeTab === 'ide' && (
            <motion.section key="ide" initial={{opacity:0}} animate={{opacity:1}} className="ide-view" style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
              <header className="view-header">
                <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                  <input 
                    className="transparent-title" 
                    value={activeStrategy.name} 
                    onChange={e => setActiveStrategy({...activeStrategy, name: e.target.value})} 
                  />
                  <span className="badge">Quantara Strategy (.json)</span>
                </div>
                <button className="primary-btn" onClick={saveStrategy}><Save size={16}/> Save Strategy</button>
              </header>
              <div style={{flex: 1, borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)'}}>
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  theme="vs-dark"
                  value={activeStrategy.config}
                  onChange={(val) => setActiveStrategy({...activeStrategy, config: val})}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    padding: { top: 20 }
                  }}
                />
              </div>
            </motion.section>
          )}

          {/* LIBRARY VIEW */}
          {activeTab === 'library' && (
            <motion.section key="library" initial={{opacity:0}} animate={{opacity:1}}>
              <header className="view-header">
                <h2>Strategy Library</h2>
                <button className="primary-btn" onClick={() => {
                  const ns = { id: Date.now().toString(), name: "New Strategy", config: JSON.stringify(DEFAULT_STRATEGY, null, 2) };
                  setStrategies([...strategies, ns]);
                  setActiveStrategy(ns);
                  setActiveTab('ide');
                }}><Plus size={16}/> New Strategy</button>
              </header>
              <div className="library-grid">
                {strategies.map(strat => (
                  <div key={strat.id} className="strat-card-v2">
                    <div className="strat-header">
                      <h3>{strat.name}</h3>
                      <div className="strat-actions">
                        <button onClick={() => { setActiveStrategy(strat); setActiveTab('ide'); }}>Edit</button>
                        <button className="delete" onClick={() => setStrategies(strategies.filter(s => s.id !== strat.id))}><Trash2 size={16}/></button>
                      </div>
                    </div>
                    <div className="strat-preview">
                      {JSON.parse(strat.config).entry_rules.length} Entry Rules • {JSON.parse(strat.config).exit_rules.length} Exit Rules
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
