import React from 'react';
import Editor from '@monaco-editor/react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Download, Save, Edit3 } from 'lucide-react';
import { LANGUAGES } from '../utils/constants';

const StrategyEditor = ({ 
  activeStrategy, setActiveStrategy, setStrategies, 
  createNewStrategy, discardChanges, addToast 
}) => {
  return (
    <motion.section key="ide" initial={{opacity:0}} animate={{opacity:1}} style={{height:'calc(100vh - 180px)', display:'flex', flexDirection:'column'}}>
      <header className="view-header">
        <div style={{flex:1}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <input 
              className="editable-title"
              value={activeStrategy.name} 
              onChange={(e) => {
                const updated = { ...activeStrategy, name: e.target.value };
                setActiveStrategy(updated);
                setStrategies(prev => prev.map(s => s.id === updated.id ? updated : s));
              }}
            />
            <Edit3 size={14} color="var(--text-muted)" />
          </div>
          <div className="sub-header-selectors">
             {LANGUAGES.map(l => (
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
          <button className="primary-btn secondary" onClick={createNewStrategy} title="Crea Nuova Strategia"><Plus size={16} /> NEW</button>
          <button className="icon-btn" onClick={discardChanges} title="Annulla Modifiche"><Trash2 size={16} /></button>
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
  );
};

export default StrategyEditor;
