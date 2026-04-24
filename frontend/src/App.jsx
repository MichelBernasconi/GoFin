import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';

// --- Components ---
import Sidebar from './components/Sidebar';
import DashboardStats from './components/DashboardStats';
import MarketChart from './components/MarketChart';
import PerformanceChart from './components/PerformanceChart';
import StrategyEditor from './components/StrategyEditor';
import MarketHub from './components/MarketHub';
import StrategyLibrary from './components/StrategyLibrary';

// --- Utilities & Constants ---
import { formatCurrency, formatDate } from './utils/formatters';
import { INITIAL_ASSETS, INITIAL_STRATEGIES } from './utils/constants';

function App() {
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Data State
  const [results, setResults] = useState(null);
  const [marketData, setMarketData] = useState([]);
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [strategies, setStrategies] = useState(INITIAL_STRATEGIES);
  const [monteCarloResults, setMonteCarloResults] = useState(null);

  // Configuration State
  const [currency, setCurrency] = useState('USD');
  const [capital, setCapital] = useState(10000);
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState('2024-01-01');
  const [timeframe, setTimeframe] = useState('1D');

  // View State
  const [chartType, setChartType] = useState('area'); 
  const [isLog, setIsLog] = useState(false);
  const [showBenchmark, setShowBenchmark] = useState(true);

  // Derivations
  const enabledAssets = assets.filter(a => a.enabled);
  const enabledStrategies = strategies.filter(s => s.enabled);
  const [selectedAsset, setSelectedAsset] = useState(enabledAssets[0]?.symbol || 'AAPL');
  const [activeStrategy, setActiveStrategy] = useState(enabledStrategies[0] || strategies[0]);

  // Effects
  useEffect(() => {
    const fetchMarket = async () => {
      setResults(null);
      setMonteCarloResults(null);
      try {
        const data = await invoke('get_market_data', { 
          symbol: selectedAsset, start: startDate, end: endDate, timeframe 
        });
        setMarketData(data);
      } catch(e) { 
        addToast('Errore caricamento dati: ' + e, 'error');
      }
    };
    fetchMarket();
  }, [selectedAsset, startDate, endDate, timeframe]);

  // Handlers
  const runBacktest = async () => {
    setLoading(true);
    setMonteCarloResults(null);
    try {
      const res = await invoke('run_simulation', { 
        initialCapital: capital, startDate, endDate, symbol: selectedAsset, _strategyId: activeStrategy.id, timeframe 
      });
      setResults(res);
      addToast(`Test completato con successo.`);
    } catch (err) { addToast('Errore: ' + err, 'error'); } 
    finally { setLoading(false); }
  };

  const runMonteCarlo = async () => {
    setLoading(true);
    try {
      const res = await invoke('run_monte_carlo', { 
        initialCapital: capital, symbol: selectedAsset, startDate, endDate, timeframe 
      });
      setMonteCarloResults(res);
      addToast(`Simulazione Monte Carlo completata.`);
    } catch (err) { addToast('Errore: ' + err, 'error'); }
    finally { setLoading(false); }
  };

  const discardChanges = () => {
    const original = strategies.find(s => s.id === activeStrategy.id);
    if (original) {
      setActiveStrategy({ ...original });
      addToast('Modifiche annullate', 'info');
    }
  };

  const createNewStrategy = () => {
    const newId = `custom_${Date.now()}`;
    const newStrat = {
      id: newId, name: 'Nuova Strategia', lang: 'rust', code: '// Scrivi qui...\n', enabled: true
    };
    setStrategies(prev => [...prev, newStrat]);
    setActiveStrategy(newStrat);
    addToast('Nuova strategia creata');
  };

  const addToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

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
                    <div className="param-item"><label>PERIOD</label>
                      <div className="date-range">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}/>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}/>
                      </div>
                    </div>
                  </div>
                  <div style={{display:'flex', gap:10}}>
                    <button className="primary-btn secondary" onClick={runMonteCarlo} disabled={loading || !results}>MONTE CARLO</button>
                    <button className="primary-btn" onClick={runBacktest} disabled={loading}>RUN TEST</button>
                  </div>
                </div>
              </header>

              <DashboardStats results={results} capital={capital} currency={currency} />

              <MarketChart 
                results={results} marketData={marketData} chartType={chartType} isLog={isLog} timeframe={timeframe} 
                showBenchmark={showBenchmark} currency={currency} setChartType={setChartType} 
                setIsLog={setIsLog} setTimeframe={setTimeframe} setShowBenchmark={setShowBenchmark} 
              />

              <PerformanceChart 
                results={results} marketData={marketData} capital={capital} currency={currency} showBenchmark={showBenchmark} 
              />

              {monteCarloResults && (
                <div className="neon-box" style={{marginTop:'2rem'}}>
                  <h3>Monte Carlo Analysis (50 Runs)</h3>
                  <div style={{display:'flex', flexWrap:'wrap', gap:8, marginTop:15}}>
                    {monteCarloResults.sort((a,b)=>b-a).map((r, i) => (
                      <div key={i} style={{padding:'4px 8px', background:'rgba(255,255,255,0.05)', borderRadius:6, fontSize:10, borderLeft: `3px solid ${r >= capital ? 'var(--accent-color)' : 'var(--danger)'}`}}>
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
            <MarketHub assets={assets} setAssets={setAssets} currency={currency} />
          )}

          {activeTab === 'ide' && (
            <StrategyEditor 
              activeStrategy={activeStrategy} setActiveStrategy={setActiveStrategy} 
              setStrategies={setStrategies} createNewStrategy={createNewStrategy} 
              discardChanges={discardChanges} addToast={addToast} 
            />
          )}

          {activeTab === 'library' && (
            <StrategyLibrary 
              strategies={strategies} setStrategies={setStrategies} 
              setActiveStrategy={setActiveStrategy} setActiveTab={setActiveTab} 
            />
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
