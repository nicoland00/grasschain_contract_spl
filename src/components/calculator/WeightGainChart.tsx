"use client";
import React from "react";
import {
  ComposedChart,
  Area,
  ReferenceLine,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  month: number;
  projectedWeight: number;
  caloriesContribution: number;
  lower10: number;
  range10: number;
  lower20: number;
  range20: number;
}

interface WeightGainChartProps {
  data: DataPoint[];
  yAxisFormatter: (value: number) => string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length && [12,18,24,36].includes(label)) {
    const proj      = payload.find((p: { dataKey: string; value: number }) => p.dataKey==="projectedWeight")?.value;
    const contribKg = payload.find((p: { dataKey: string; value: number }) => p.dataKey==="caloriesContribution")?.value;
    const contrib$  = (contribKg * 2.5).toFixed(2);
    const monthLabel = label===12?"12 months":
                       label===18?"18 months":
                       label===24?"24 months":
                       "36 months";

    return (
      <div className="bg-card p-3 rounded-md shadow-lg border border-border text-black">
        <p className="font-semibold">{`Month: ${monthLabel}`}</p>
        <p className="text-projection">{`Projected: ${proj.toFixed(1)} kg`}</p>
        <p className="text-contribution">
          {`Initial Contribution: $${contrib$} (${contribKg.toFixed(1)} kg)`}
        </p>
      </div>
    );
  }
  return null;
};

const WeightGainChart: React.FC<WeightGainChartProps> = ({
  data,
  yAxisFormatter,
}) => {
  const ticks = [12, 18, 24, 36];

  return (
    <div className="w-full h-64 mt-4 mb-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top:5,right:5,left:5,bottom:5 }}>
          <defs>
            {/* ±20% band, lighter */}
            <linearGradient id="band20" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#4ECCA3" stopOpacity={0.7}/>
              <stop offset="100%" stopColor="#4ECCA3" stopOpacity={0}/>
            </linearGradient>
            {/* ±10% band, darker */}
            <linearGradient id="band10" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#4ECCA3" stopOpacity={0.9}/>
              <stop offset="100%" stopColor="#4ECCA3" stopOpacity={0}/>
            </linearGradient>
            {/* blue contribution fill */}
            <linearGradient id="contribBand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3A86FF" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3A86FF" stopOpacity={0.2}/>
            </linearGradient>
          </defs>

          {/* X axis */}
          <XAxis
            dataKey="month"
            ticks={ticks}
            axisLine={{ stroke: "#D1D5DB" }}
            tickLine={false}
            tick={{ fill: "#888", fontSize: 12 }}
            tickFormatter={m =>
              m===12?"12 months":
              m===18?"18 months":
              m===24?"24 months":
              "36 months"
            }
          />
          {ticks.map(m => (
            <ReferenceLine key={m} x={m} stroke="#E5E7EB" strokeDasharray="3 3" />
          ))}

          {/* Y axis */}
          <YAxis
            tickFormatter={yAxisFormatter}
            axisLine={{ stroke: "#D1D5DB" }}
            tickLine={false}
            tick={{ fill: "#888", fontSize: 12 }}
            width={60}
          />
          <ReferenceLine y={0} stroke="#E5E7EB" />

          <Tooltip content={<CustomTooltip />} />

          {/* draw ±20% band */}
          <Area
            type="monotone"
            dataKey="lower20"
            stackId="2"
            stroke="none"
            fill="none"
          />
          <Area
            type="monotone"
            dataKey="range20"
            stackId="2"
            stroke="none"
            fill="url(#band20)"
            isAnimationActive={false}
          />

          {/* draw ±10% band on top */}
          <Area
            type="monotone"
            dataKey="lower10"
            stackId="1"
            stroke="none"
            fill="none"
          />
          <Area
            type="monotone"
            dataKey="range10"
            stackId="1"
            stroke="none"
            fill="url(#band10)"
            isAnimationActive={false}
          />

          {/* solid green mean line */}
          <Area
            type="monotone"
            dataKey="projectedWeight"
            stroke="#4ECCA3"
            strokeWidth={2}
            fill="none"
            dot={false}
          />

          {/* blue contribution */}
          <Area
            type="monotone"
            dataKey="caloriesContribution"
            stroke="none"
            fill="url(#contribBand)"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeightGainChart;
