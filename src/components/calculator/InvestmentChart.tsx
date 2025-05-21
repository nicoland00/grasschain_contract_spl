
import React from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface DataPoint {
  year: number;
  projectedValue: number;
  contribution: number;
}

interface InvestmentChartProps {
  data: DataPoint[];
  yAxisFormatter: (value: number) => string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card p-3 rounded-md shadow-lg border border-border">
        <p className="font-semibold">{`Year: ${label}`}</p>
        <p className="text-projection">
          {`Projected: ${new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'EUR',
            maximumFractionDigits: 0 
          }).format(payload[0].value)}`}
        </p>
        <p className="text-contribution">
          {`Contribution: ${new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: 'EUR',
            maximumFractionDigits: 0 
          }).format(payload[1].value)}`}
        </p>
      </div>
    );
  }
  return null;
};

const InvestmentChart: React.FC<InvestmentChartProps> = ({ data, yAxisFormatter }) => {
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
            dataKey="year"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#888', fontSize: 12 }}
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
            dataKey="projectedValue" 
            stroke="#4ECCA3" 
            fillOpacity={1}
            fill="url(#projectionGradient)" 
          />
          <Area 
            type="monotone" 
            dataKey="contribution" 
            stroke="#3A86FF" 
            fillOpacity={1}
            fill="url(#contributionGradient)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default InvestmentChart;
