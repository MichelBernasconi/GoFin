import React from 'react';
import { formatCurrency } from '../utils/formatters';

const DashboardStats = ({ results, capital, currency }) => {
  return (
    <div className="stats-header-grid">
      <div className="stat-card">
        <label>Algorithm Return</label>
        <div className={`value ${(!results || results.total_return >= 0) ? 'plus' : 'minus'}`}>
          {results ? results.total_return.toFixed(2) : '---'}%
        </div>
      </div>
      <div className="stat-card">
        <label>Benchmark (B&H)</label>
        <div className={`value ${(!results || results.benchmark_return >= 0) ? 'plus' : 'minus'}`}>
          {results ? results.benchmark_return.toFixed(2) : '---'}%
        </div>
      </div>
      <div className="stat-card">
        <label>Current Equity</label>
        <div className="value big">{formatCurrency(results ? results.final_value : capital, currency)}</div>
      </div>
      <div className="stat-card">
        <label>Max Drawdown</label>
        <div className="value minus">{results ? results.max_drawdown.toFixed(2) : '---'}%</div>
      </div>
    </div>
  );
};

export default DashboardStats;
