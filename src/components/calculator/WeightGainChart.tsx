import React from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from 'recharts';

interface DataPoint {
  month: number;
  projectedWeight: number;
  caloriesContribution: number;
}

interface WeightGainChartProps {
  data: DataPoint[];
  yAxisFormatter: (value: number) => string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    if (![12, 18, 24, 36].includes(label)) return null;
    return (
      <div className="bg-card p-3 rounded-md shadow-lg border border-border text-black">
        <p className="font-semibold">{`Month: ${
          label === 12 ? '12 months' :
          label === 18 ? '18 months' :
          label === 24 ? '24 months' :
          '36 months'
        }`}</p>
        <p className="text-projection">
          {`Projected: ${payload[0].value.toFixed(1)} kg`}
        </p>
        <p className="text-contribution">
         {(() => {
           const contributionKg = payload[1].value;
           const contributionDollar = contributionKg * 2.5;
           return `Initial Contribution: $${contributionDollar.toFixed(2)} (${contributionKg.toFixed(2)} kg)`;
         })()}
       </p>
      </div>
    );
  }
  return null;
};

const WeightGainChart: React.FC<WeightGainChartProps> = ({ data, yAxisFormatter }) => {
  const ticks = [12, 18, 24, 36];
  
  return (
    <div className="w-full h-64 mt-4 mb-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <defs>
            <linearGradient id="projectionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4ECCA3" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#4ECCA3" stopOpacity={0.2} />
            </linearGradient>
            <linearGradient id="contributionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3A86FF" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3A86FF" stopOpacity={0.2} />
            </linearGradient>
          </defs>
            <XAxis 
            dataKey="month"
            // draw only our four ticks:
            ticks={ticks}
            // subtle gray ais line
            axisLine={{ stroke: '#D1D5DB' }}
            tickLine={false}
            tick={{ fill: '#888', fontSize: 12 }}
            tickFormatter={(m) => {
              // label them in full:
              return m === 12
                ? '12 months'
                : m === 18
                ? '18 months'
                : m === 24
                ? '24 months'
                : '36 months';
            }}
          />
          {/* vertical gray lines at each tick */}
          {ticks.map((m) => (
            <ReferenceLine key={m} x={m} stroke="#E5E7EB" strokeDasharray="3 3" />
          ))} 
          <YAxis
            tickFormatter={yAxisFormatter}
            axisLine={{stroke: '#D1D5DB'}}
            tickLine={false}
            tick={{ fill: '#888', fontSize: 12 }}
            width={60}
          />
          <ReferenceLine y={0} stroke="#E5E7EB" />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="projectedWeight" 
            stroke="#4ECCA3" 
            fillOpacity={1}
            fill="url(#projectionGradient)" 
          />
          <Area 
            type="monotone" 
            dataKey="caloriesContribution" 
            stroke="#3A86FF" 
            fillOpacity={1}
            fill="url(#contributionGradient)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeightGainChart;
