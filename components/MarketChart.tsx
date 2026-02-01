
import React from 'react';
import { 
  ComposedChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Scatter,
  ZAxis
} from 'recharts';
import { PricePoint, MarketSignal } from '../types';

interface MarketChartProps {
  data: PricePoint[];
  signals?: MarketSignal[];
  isPositive: boolean;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const time = data.time || data.t;
    const price = data.price || data.p;
    const isSignal = data.type !== undefined;

    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-2xl backdrop-blur-md">
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">
          {new Date(time).toLocaleString()}
        </p>
        <div className="flex flex-col gap-1">
          {isSignal && (
            <span className={`text-[10px] w-fit px-2 py-0.5 rounded font-black mb-1 ${data.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
              {data.type} SIGNAL
            </span>
          )}
          <p className="text-white font-bold mono text-base">
            ${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const SignalDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  
  const isBuy = payload.type === 'BUY';
  const color = isBuy ? '#10b981' : '#f43f5e';
  
  return (
    <g transform={`translate(${cx},${cy})`}>
      <circle r="8" fill={color} fillOpacity="0.2" className="animate-pulse" />
      <circle r="4" fill={color} stroke="#0f172a" strokeWidth="2" />
      <path 
        d={isBuy ? "M0 -14 L4 -8 L-4 -8 Z" : "M0 14 L4 8 L-4 8 Z"} 
        fill={color} 
      />
      <text 
        x="0" 
        y={isBuy ? -22 : 28} 
        textAnchor="middle" 
        fill={color} 
        fontSize="11" 
        fontWeight="900"
        className="pointer-events-none uppercase tracking-tighter"
        style={{ filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.8))' }}
      >
        {isBuy ? 'Buy' : 'Sell'}
      </text>
    </g>
  );
};

const MarketChart: React.FC<MarketChartProps> = ({ data, signals = [], isPositive }) => {
  const chartColor = isPositive ? '#10b981' : '#ef4444';
  
  // Ensure we have data to render
  if (!data || data.length === 0) return (
    <div className="h-[400px] flex items-center justify-center text-slate-500 italic">
      Waiting for market stream...
    </div>
  );

  return (
    <div className="h-[400px] w-full mt-4" style={{ minHeight: '400px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 30, right: 10, left: 0, bottom: 10 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
          <XAxis 
            dataKey="time" 
            type="number"
            domain={['dataMin', 'dataMax']}
            hide={true}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            orientation="right"
            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
            tickFormatter={(val) => `$${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val.toFixed(2)}`}
            axisLine={false}
            tickLine={false}
          />
          <ZAxis range={[100, 100]} />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ stroke: '#334155', strokeWidth: 1 }}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke={chartColor} 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            animationDuration={1000}
            activeDot={{ r: 5, fill: chartColor, stroke: '#fff', strokeWidth: 2 }}
          />
          {signals && signals.length > 0 && (
            <Scatter 
              data={signals} 
              dataKey="price"
              shape={<SignalDot />}
              isAnimationActive={true}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MarketChart;
