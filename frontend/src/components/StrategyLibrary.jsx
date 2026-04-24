import React from 'react';
import { Edit3 } from 'lucide-react';

const StrategyLibrary = ({ strategies, setStrategies, setActiveStrategy, setActiveTab }) => {
  const getLangColor = (lang) => {
    if (lang === 'rust') return '#f74c00';
    if (lang === 'python') return '#3776ab';
    return '#f1e05a';
  };

  const toggleStrategy = (id) => {
    setStrategies(strategies.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x));
  };

  return (
    <section>
      <header className="view-header"><h2>Local Library</h2></header>
      <div className="stats-header-grid">
        {strategies.map(s => (
          <div key={s.id} className="stat-card" style={{ opacity: s.enabled ? 1 : 0.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ 
                fontSize: '0.6rem', padding: '2px 6px', background: getLangColor(s.lang), 
                color: '#000', borderRadius: 4, fontWeight: 900, textTransform: 'uppercase' 
              }}>
                {s.lang}
              </span>
              <input type="checkbox" checked={s.enabled} onChange={() => toggleStrategy(s.id)} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <div className="value">{s.name}</div>
              <button 
                className="icon-btn" 
                onClick={() => { setActiveStrategy(s); setActiveTab('ide'); }}
              >
                <Edit3 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StrategyLibrary;
