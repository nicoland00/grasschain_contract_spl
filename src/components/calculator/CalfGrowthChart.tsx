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
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl border border-gray-700">
          <p className="font-medium text-sm">{`${label} meses`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="font-semibold" style={{ color: entry.color }}>
              {entry.dataKey === 'weight' && `Proyección: ${entry.value} kg`}
              {entry.dataKey === 'weightPlus20' && `Rango +20%: ${entry.value.toFixed(0)} kg`}
              {entry.dataKey === 'weightMinus20' && `Rango -20%: ${entry.value.toFixed(0)} kg`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl p-8 text-white">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Crecimiento de Ternera</h2>
        <p className="text-gray-400 text-lg">Proyección de peso estimado (0–40 meses)</p>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-8 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-green-400"></div>
            <span className="text-gray-300">Peso proyectado</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
            <span className="text-gray-300">Rango +20%</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-orange-400"></div>
            <span className="text-gray-300">Rango -20%</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-gray-400 text-sm mb-1">Peso inicial</p>
            <p className="text-2xl font-bold">25 kg</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Peso final estimado</p>
            <p className="text-2xl font-bold text-green-400">500 kg</p>
          </div>
        </div>
      </div>

      <div className="w-full h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={growthData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
            <defs>
              <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(value) => `${value}m`} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(value) => `${value} kg`} domain={[0, 650]} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="weight" stroke="#4ade80" strokeWidth={4} dot={{ fill: '#4ade80', strokeWidth: 0, r: 6 }} activeDot={{ r: 8, fill: '#22c55e', stroke: '#4ade80', strokeWidth: 2 }} fill="url(#growthGradient)" />
            <Line type="monotone" dataKey="weightPlus20" stroke="#fbbf24" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#fbbf24', strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: '#f59e0b', stroke: '#fbbf24', strokeWidth: 2 }} />
            <Line type="monotone" dataKey="weightMinus20" stroke="#fb923c" strokeWidth={2} strokeDasharray="3 3" dot={{ fill: '#fb923c', strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: '#ea580c', stroke: '#fb923c', strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-500 leading-relaxed">
          Los datos son aproximaciones basadas en el crecimiento promedio de terneras.<br />
          Los valores reales pueden variar según factores individuales y condiciones de crianza.
        </p>
      </div>
    </div>
  );
};

export default CalfGrowthChart;