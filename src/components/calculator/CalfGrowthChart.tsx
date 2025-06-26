import React from 'react';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const CalfGrowthChart: React.FC = () => {
  const growthData = [
    { month: 0,  weight: 25,  weightPlus20: 25,          weightMinus20: 25 },
    { month: 6,  weight: 75,  weightPlus20: 75 * 1.2,  weightMinus20: 75 * 0.8 },
    { month: 12, weight: 150, weightPlus20: 150 * 1.2, weightMinus20: 150 * 0.8 },
    { month: 18, weight: 230, weightPlus20: 230 * 1.2, weightMinus20: 230 * 0.8 },
    { month: 24, weight: 320, weightPlus20: 320 * 1.2, weightMinus20: 320 * 0.8 },
    { month: 30, weight: 410, weightPlus20: 410 * 1.2, weightMinus20: 410 * 0.8 },
    { month: 36, weight: 480, weightPlus20: 480 * 1.2, weightMinus20: 480 * 0.8 },
    { month: 40, weight: 500, weightPlus20: 500 * 1.2, weightMinus20: 500 * 0.8 },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-3 rounded-md shadow-lg border border-border">
          <p className="font-semibold">{`Month: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="font-semibold" style={{ color: entry.color }}>
              {entry.dataKey === 'weight' && `Projected: ${entry.value} kg`}
              {entry.dataKey === 'weightPlus20' && `+20% range: ${entry.value.toFixed(0)} kg`}
              {entry.dataKey === 'weightMinus20' && `-20% range: ${entry.value.toFixed(0)} kg`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full rounded-2xl p-8 bg-white text-black shadow">
      <div className="mb-8">
      <h2 className="text-3xl font-bold mb-2">Calf Growth</h2>
      <p className="text-gray-600 text-lg">Estimated weight projection (0–40 months)</p>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-8 mb-4">
          <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-[#4ECCA3]"></div>
          <span className="text-gray-600">Projected</span>
          </div>
          <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-[#3A86FF]"></div>
          <span className="text-gray-600">+20% range</span>
          </div>
          <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-[#9dbff9]"></div>
          <span className="text-gray-600">-20% range</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
          <p className="text-gray-600 text-sm mb-1">Starting weight</p>
            <p className="text-2xl font-bold">25 kg</p>
          </div>
          <div>
          <p className="text-gray-600 text-sm mb-1">Estimated final weight</p>
          <p className="text-2xl font-bold text-[#4ECCA3]">500 kg</p>
          </div>
        </div>
      </div>

      <div className="w-full h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={growthData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.3} />
            <XAxis dataKey="month" axisLine={{ stroke: '#D1D5DB' }} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(value) => `${value}m`} />
            <YAxis axisLine={{ stroke: '#D1D5DB' }} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(value) => `${value} kg`} domain={[0, 650]} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="weight" stroke="#4ECCA3" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="weightPlus20" stroke="#3A86FF" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
            <Line type="monotone" dataKey="weightMinus20" stroke="#9dbff9" strokeWidth={1.5} strokeDasharray="1 2" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-500 leading-relaxed">
        Figures are estimates based on average calf growth and may vary with feeding conditions.
        </p>
      </div>
    </div>
  );
};

export default CalfGrowthChart;