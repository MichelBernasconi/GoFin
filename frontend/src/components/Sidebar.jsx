import React from 'react';
import { TrendingUp, LayoutDashboard, Globe, Code2, Library } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="sidebar">
      <div className="logo">
        <TrendingUp size={28} color="var(--accent-color)" />
        <span>GoFin</span>
      </div>
      <div className="nav-links">
        <div className="nav-section-label">MARKET</div>
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''} 
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={18} /> Dashboard
        </button>
        <button 
          className={activeTab === 'market' ? 'active' : ''} 
          onClick={() => setActiveTab('market')}
        >
          <Globe size={18} /> Market Data
        </button>
        
        <div className="nav-section-label">QUANT</div>
        <button 
          className={activeTab === 'ide' ? 'active' : ''} 
          onClick={() => setActiveTab('ide')}
        >
          <Code2 size={18} /> Strategy Lab
        </button>
        <button 
          className={activeTab === 'library' ? 'active' : ''} 
          onClick={() => setActiveTab('library')}
        >
          <Library size={18} /> Library
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
