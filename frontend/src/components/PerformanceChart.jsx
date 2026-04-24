import React from 'react';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, Line } from 'recharts';
import CustomTooltip from './CustomTooltip';
import { formatCurrency } from '../utils/formatters';

const PerformanceChart = ({ results, marketData, capital, currency, showBenchmark }) => {
  if (!results && marketData.length === 0) return null;

  return (
    <div className="neon-box chart-container" style={{height: 280, marginTop: '2rem'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
        <h3 style={{margin:0, fontSize:14, color:'var(--text-muted)'}}>Performance Analysis (vs Buy & Hold)</h3>
        <div style={{display:'flex', gap:15, fontSize:10, fontWeight:800}}>
          {results && <div style={{color:'var(--accent-color)'}}>● STRATEGY EQUITY</div>}
          <div style={{color:'rgba(255,255,255,0.4)'}}>-- BENCHMARK (B&H)</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <AreaChart data={(results ? results.data_points : marketData).map((d, idx, arr) => {
          const first = arr[0].close;
          const last = arr[arr.length - 1].close;
          const b_ret = ((last - first) / first);
          
          const initialBench = capital;
          const finalBench = capital * (1 + b_ret);
          
          let _bench = null;
          if (idx === 0) _bench = initialBench;
          if (idx === arr.length - 1) _bench = finalBench;
          return { ...d, _bench };
        })}>
          <defs><linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.2}/><stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false}/>
          <XAxis dataKey="date" hide />
          <YAxis orientation="right" axisLine={false} tickLine={false} tick={{fill:'#475569', fontSize:10}} tickFormatter={v => formatCurrency(v, currency)} domain={['dataMin', 'dataMax']} />
          <Tooltip content={<CustomTooltip currency={currency} isLog={false} />} />
          {results && <Area type="monotone" dataKey="equity" stroke="var(--accent-color)" fill="url(#eqGrad)" strokeWidth={2} />}
          {showBenchmark && (
             <Line type="monotone" dataKey="_bench" stroke="rgba(255,255,255,0.3)" strokeDasharray="5 5" connectNulls dot={false} strokeWidth={1} />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;
