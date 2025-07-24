"use client";
import React, { useEffect, useState } from 'react';
import { Bar, BarChart, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts';

interface DataPoint {
  month: number;
  projectedWeight: number;
  caloriesContribution: number;
}

interface WeightGainChartProps {
  data: DataPoint[];
  yAxisFormatter: (value: number) => string;
}


const WeightGainChart: React.FC<WeightGainChartProps> = ({ data, yAxisFormatter }) => {
  const barData = [
    { period: '12m', projectedWeight: data.find(d => d.month === 12)?.projectedWeight || 0, caloriesContribution: data.find(d => d.month === 12)?.caloriesContribution || 0 },
    { period: '24m', projectedWeight: data.find(d => d.month === 24)?.projectedWeight || 0, caloriesContribution: data.find(d => d.month === 24)?.caloriesContribution || 0 },
    { period: '36m', projectedWeight: data.find(d => d.month === 36)?.projectedWeight || 0, caloriesContribution: data.find(d => d.month === 36)?.caloriesContribution || 0 }
  ];
  const [axisMax, setAxisMax] = useState(0);

  useEffect(() => {
    const localMax = Math.max(...barData.map(d => d.projectedWeight));
    setAxisMax(prev => (localMax > prev ? localMax : prev));
  }, [barData]);


  return (
    <div className="w-full h-64 mt-4 mb-8">
      <ResponsiveContainer width="100%" height="100%">
      <BarChart
          data={barData}
          margin={{ top: 20, right: 5, left: 5, bottom: 5 }}
        >
          <XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#888', fontSize: 12 }}
          />

          <YAxis
            tickFormatter={yAxisFormatter}
            domain={[0, axisMax * 1.1]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#888', fontSize: 12 }}
            width={60}
          />

          <Bar
            dataKey="projectedWeight"
            fill="#4ECCA3"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
            >
              <LabelList
                dataKey="projectedWeight"
                position="top"
                formatter={(v: number) => `${v.toFixed(1)} kg`}
                fill="#000"
              />
            </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeightGainChart;
