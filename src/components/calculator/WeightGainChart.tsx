"use client";
import React from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

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
    const projectedWeight = payload[0].value;
    const contribution = payload[0].payload.caloriesContribution;
    const costPerKilogram = 2.5; // $2.5 per kg of meat
    const meatKilograms = contribution / costPerKilogram; // Convert dollars to kg

    return (
      <div className="bg-card p-3 rounded-md shadow-lg border border-border">
        <p className="font-semibold">{`Period: ${label}`}</p>
        <p className="text-projection">
          {`Projected: ${projectedWeight.toFixed(1)} kg`}
        </p>
        <p className="text-contribution">
          {`Total Contribution: $${contribution.toFixed(2)} (${meatKilograms.toFixed(2)}kg)`}
        </p>
      </div>
    );
  }
  return null;
};

const WeightGainChart: React.FC<WeightGainChartProps> = ({ data, yAxisFormatter }) => {
  const barData = [
    { period: '12m', projectedWeight: data.find(d => d.month === 12)?.projectedWeight || 0, caloriesContribution: data.find(d => d.month === 12)?.caloriesContribution || 0 },
    { period: '24m', projectedWeight: data.find(d => d.month === 24)?.projectedWeight || 0, caloriesContribution: data.find(d => d.month === 24)?.caloriesContribution || 0 },
    { period: '36m', projectedWeight: data.find(d => d.month === 36)?.projectedWeight || 0, caloriesContribution: data.find(d => d.month === 36)?.caloriesContribution || 0 }
  ];

  return (
    <div className="w-full h-64 mt-4 mb-8">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={barData}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <XAxis
            dataKey="period"
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
          <Bar
            dataKey="projectedWeight"
            fill="#4ECCA3"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeightGainChart;
