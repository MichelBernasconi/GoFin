import React from 'react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, Bar, Cell, Line } from 'recharts';
import { CandlestickChart, Activity } from 'lucide-react';
import CustomTooltip from './CustomTooltip';
import { formatCurrency } from '../utils/formatters';
import { TIMEFRAMES } from '../utils/constants';

const MarketChart = ({ 
  results, marketData, chartType, isLog, timeframe, showBenchmark, currency,
  setChartType, setIsLog, setTimeframe, setShowBenchmark
}) => {
  return (
    <div className="neon-box chart-container" style={{height: 480, marginTop: '2rem', position: 'relative'}}>
      <div className="chart-controls-overlay">
        <div className="timeframe-group">
          {TIMEFRAMES.map(tf => (
            <button 
              key={tf}
              className={`tf-btn ${timeframe === tf ? 'active' : ''}`}
              onClick={() => setTimeframe(tf)}
            >
              {tf}
            </button>
          ))}
        </div>
        <div className="view-toggles" style={{display:'flex', gap:6}}>
          <button 
            className={`icon-btn small ${showBenchmark ? 'active-toggle' : ''}`} 
            onClick={() => setShowBenchmark(!showBenchmark)}
            title="Toggle Benchmark Line"
          >
            <span style={{fontSize:9, fontWeight:900}}>BENCH</span>
          </button>
          <button 
            className={`icon-btn small ${chartType === 'candle' ? 'active-toggle' : ''}`} 
            onClick={() => {
              const next = chartType === 'area' ? 'candle' : 'area';
              setChartType(next);
              if (next === 'candle') setIsLog(false);
            }}
            title="Toggle Candlestick"
          >
            {chartType === 'area' ? <CandlestickChart size={16} /> : <Activity size={16} />}
          </button>
          <button 
            className={`icon-btn small ${isLog ? 'active-toggle' : ''}`} 
            onClick={() => setIsLog(!isLog)}
            disabled={chartType === 'candle'}
            title={chartType === 'candle' ? "Log scale disabled for Candles" : "Toggle Logarithmic Scale"}
          >
            <span style={{fontSize:10, fontWeight:900}}>{isLog ? 'LOG' : 'LIN'}</span>
          </button>
        </div>
      </div>

      <div className="chart-legend" style={{display:'flex', gap:20, marginBottom:20, fontSize:11, color:'var(--text-muted)'}}>
          <div style={{display:'flex', alignItems:'center', gap:5}}><span style={{width:10, height:2, background:'var(--accent-color)'}}/> Market Price</div>
          <div style={{display:'flex', alignItems:'center', gap:5}}><span style={{width:8, height:8, background:'var(--accent-color)', borderRadius:'50%'}}/> BUY</div>
          <div style={{display:'flex', alignItems:'center', gap:5}}><span style={{width:8, height:8, background:'var(--danger)', borderRadius:'50%'}}/> SELL</div>
      </div>

      <ResponsiveContainer width="100%" height="90%">
        <ComposedChart 
          key={`market-${chartType}-${timeframe}-${isLog}`}
          data={(results ? results.data_points : marketData).map((d, idx, arr) => {
            if (arr.length === 0) return d;
            const first = arr[0].close;
            const last = arr[arr.length - 1].close;
            let _benchPrice = null;
            if (idx === 0) _benchPrice = isLog ? Math.log10(first) : first;
            if (idx === arr.length - 1) _benchPrice = isLog ? Math.log10(last) : last;

            return {
              ...d,
              _close: isLog ? Math.log10(Math.max(0.01, d.close)) : d.close,
              _benchPrice,
              _wick: [
                isLog ? Math.log10(Math.max(0.01, d.low)) : d.low,
                isLog ? Math.log10(Math.max(0.01, d.high)) : d.high
              ],
              _body: [
                isLog ? Math.log10(Math.max(0.01, d.open)) : d.open,
                isLog ? Math.log10(Math.max(0.01, d.close)) : d.close
              ]
            };
          })}>
          <defs><linearGradient id="p" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.15}/><stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false}/>
          <XAxis dataKey="date" hide />
          <YAxis 
            orientation="right" 
            axisLine={false} 
            tickLine={false} 
            tick={{fill:'#475569', fontSize:10}} 
            tickFormatter={v => formatCurrency(isLog ? Math.pow(10, v) : v, currency)}
            domain={['dataMin', 'dataMax']}
          />
          <Tooltip content={<CustomTooltip currency={currency} isLog={isLog} />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
          
          {showBenchmark && (
            <Line type="monotone" dataKey="_benchPrice" stroke="rgba(255,255,255,0.3)" strokeDasharray="5 5" connectNulls dot={false} strokeWidth={1} />
          )}

          {chartType === 'area' ? (
            <Area type="monotone" dataKey="_close" stroke="var(--accent-color)" strokeWidth={2.5} fill="url(#p)" baseValue="dataMin" dot={(props) => {
                const { cx, cy, payload } = props;
                if (payload.trade === 'BUY') return <circle cx={cx} cy={cy} r={6} fill="var(--accent-color)" stroke="#fff" strokeWidth={2} />;
                if (payload.trade === 'SELL') return <circle cx={cx} cy={cy} r={6} fill="var(--danger)" stroke="#fff" strokeWidth={2} />;
                return null;
            }} />
          ) : (
            <>
              <Bar dataKey="_wick" barSize={2} fill="#64748b" />
              <Bar dataKey="_body" barSize={8}>
                {(results ? results.data_points : marketData).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.close >= entry.open ? 'var(--accent-color)' : 'var(--danger)'} />
                ))}
              </Bar>
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MarketChart;
