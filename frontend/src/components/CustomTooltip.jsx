import React from 'react';
import { formatDate, formatCurrency } from '../utils/formatters';

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

export default CustomTooltip;
