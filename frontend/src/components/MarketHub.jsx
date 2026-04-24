import React from 'react';
import { formatCurrency } from '../utils/formatters';

const MarketHub = ({ assets, setAssets, currency }) => {
  return (
    <section>
      <header className="view-header"><h2>Market Hub</h2></header>
      <div className="neon-box">
        <table className="trade-table">
          <thead>
            <tr>
              <th>DISPLAY</th>
              <th>SYMBOL</th>
              <th>NAME</th>
              <th>LAST PRICE</th>
              <th>CHANGE</th>
            </tr>
          </thead>
          <tbody>
            {assets.map(a => (
              <tr key={a.symbol}>
                <td>
                  <input 
                    type="checkbox" 
                    checked={a.enabled} 
                    onChange={() => setAssets(assets.map(x => x.symbol === a.symbol ? { ...x, enabled: !x.enabled } : x))} 
                  />
                </td>
                <td><strong>{a.symbol}</strong></td>
                <td>{a.name}</td>
                <td>{formatCurrency(a.price, currency)}</td>
                <td style={{ color: a.change.startsWith('+') ? 'var(--accent-color)' : 'var(--danger)' }}>{a.change}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default MarketHub;
