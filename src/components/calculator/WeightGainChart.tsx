
import React from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

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
    
    return (
      <div className="bg-card p-3 rounded-md shadow-lg border border-border text-black">
        <p className="font-semibold">{`Month: ${label}`}</p>
        <p className="text-projection">
          {`Projected: ${payload[0].value.toFixed(1)} kg`}
        </p>
        <p className="text-contribution">
         {(() => {
           const contributionKg = payload[1].value;
           const contributionDollar = contributionKg * 2.5;
           return `Total Contribution: $${contributionDollar.toFixed(2)} (${contributionKg.toFixed(2)} kg)`;
         })()}
       </p>
      </div>
    );
  }
  return null;
};

const WeightGainChart: React.FC<WeightGainChartProps> = ({ data, yAxisFormatter }) => {
  const hoverableMonths = [0, 12, 18, 24, 36]; // Only these months will be shown on the x-axis
  
  // Filter data to only include the months we want to show
  const filteredData = data.filter(item => hoverableMonths.includes(item.month));
  
  return (
    <div className="w-full h-64 mt-4 mb-8">
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
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#888', fontSize: 12 }}
            tickFormatter={(value) => {
              if (hoverableMonths.includes(value)) {
                return value === 0 ? '0m' : `${value}m`;
              }
              return "";
            }}
          />
          <YAxis 
            tickFormatter={yAxisFormatter}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#888', fontSize: 12 }}
            width={60}
          />
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
