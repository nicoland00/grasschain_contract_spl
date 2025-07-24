// src/components/calculator/ui/WeightGainForm.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/calculator/ui/card';
import { Button } from '@/components/calculator/ui/button';
import WeightGainChart from './WeightGainChart';
import WeightCard from './WeightCard';
import { calculateWeightGain } from '@/utils/weight';

interface WeightGainFormProps {
  initialWeight?: number;
  initialCaloriesAmount?: number;
}

const WeightGainForm: React.FC<WeightGainFormProps> = ({
  initialWeight = 200,
  initialCaloriesAmount = 2.5,
}) => {
  // Slider range in USD
  const minAmt = 2.5;
  const maxAmt = 10000;

  // ────────────────────────────────────────────────────────────────────────────
  // Local state
  // ────────────────────────────────────────────────────────────────────────────
  const [caloriesAmount, setCaloriesAmount] = useState<number>(initialCaloriesAmount);
  const [projectionData, setProjectionData] = useState<Array<{
    month: number;
    projectedWeight: number;
    caloriesContribution: number;
    lower10: number;
    range10: number;
    lower20: number;
    range20: number;
  }>>([]);
  const [projectedWeight, setProjectedWeight] = useState<number>(0);

  // price per kilogram of meat
  const costPerKilogram = 2.5;
  // how many kg of meat you bought with "caloriesAmount" USD
  const meatKilograms = caloriesAmount / costPerKilogram;

  // ────────────────────────────────────────────────────────────────────────────
  // Formatters
  // ────────────────────────────────────────────────────────────────────────────
  const formatter = (value: number) => `${value.toFixed(1)} kg`;
  const yAxisFormatter = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
    return `${value}`;
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Whenever "caloriesAmount" or "duration" changes, re‐compute the projection
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const { data, finalProjectedWeight, finalCaloriesContribution } =
      calculateWeightGain({
        initialWeight,
        dailyCaloriesAmount: caloriesAmount,
        months: 36,
      });

    setProjectionData(data);
    setProjectedWeight(finalProjectedWeight);
  }, [caloriesAmount, initialWeight]);

  // ────────────────────────────────────────────────────────────────────────────
  // Compute fill percentage for the slider (0 → 100%)
  // ────────────────────────────────────────────────────────────────────────────
  const fillPct = Math.min(
    100,
    Math.max(0, ((caloriesAmount - minAmt) / (maxAmt - minAmt)) * 100)
  );

  // ────────────────────────────────────────────────────────────────────────────
  // Slider colors (tailwind‐compatible values)
  // ────────────────────────────────────────────────────────────────────────────
  const fillColor = '#4ECCA3';      // green
  const trackColor = '#E5E7EB';     // light gray
  const borderColor = '#D1D5DB';    // slightly darker gray

  return (
    <>
      <Card className="bg-appDarkGray border-border">
        <CardContent className="p-6">
          {/* ───── Title ───── */}
          <div className="mb-6 animate-fade-in">
            <h2 className="text-3xl font-bold mb-1 text-black text-center">
              Projected Weight Gain
            </h2>
            {/* ───── Summary Cards ───── */}
            <div className="mt-4 grid grid-cols-2 gap-4 text-black items-center">
            {/* Projected Weight */}
            <div className="flex items-center justify-center">
              <WeightCard
                title="Projected (36 months)"
                value={formatter(projectedWeight)}
                color={fillColor}
              />
            </div>

            {/* 3) Today's Contribution */}
            <div className="flex items-center justify-center">
              <WeightCard
                title="Today"
                value={`${meatKilograms.toFixed(1)} kg`}
                color="#3A86FF"
              />
            </div>
          </div>
          </div>

          {/* ───── Chart ───── */}
          <WeightGainChart data={projectionData} yAxisFormatter={yAxisFormatter} />

          {/* ───── Slider & Display ───── */}
          <div className="mt-4">
            <div className="flex justify-between mb-2">
              <h3 className="text-xl font-bold text-black">Contribution amount</h3>
              <span className="text-xl font-bold text-black">
                {/* Show kg first, then USD in parentheses */}
                {meatKilograms.toFixed(1)} kg (${caloriesAmount.toFixed(2)})
              </span>
            </div>

            <input
              type="range"
              min={minAmt}
              max={maxAmt}
              step={0.5}
              value={caloriesAmount}
              onChange={(e) => setCaloriesAmount(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer investment-slider"
              style={{
                background: `linear-gradient(
                  to right,
                  ${fillColor} 0%,
                  ${fillColor} ${fillPct}%,
                  ${trackColor} ${fillPct}%,
                  ${trackColor} 100%
                )`,
                border: `1px solid ${borderColor}`,
              }}
            />
          </div>

          {/* ───── Disclaimer Text ───── */}
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground mb-4 text-black">
              Simulated future weight projections are not a reliable indicator of actual results.
              Projected values are estimates based on general weight gain principles and vary based on individual factors.
              All values shown are estimates and individual results may vary.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ────────────────────────────────────────────────────────────────────────────
            Global CSS for styling the range-thumb so that it is centered and colored
      ──────────────────────────────────────────────────────────────────────────── */}
      <style jsx global>{`
        /* Remove default focus outline */
        input.investment-slider:focus {
          outline: none;
        }

        /* WebKit slider thumb */
        input.investment-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 1rem;             /* 16px */
          height: 1rem;            /* 16px */
          border-radius: 50%;
          background: ${fillColor};
          cursor: pointer;
          margin-top: -0.25rem;     /* center on 8px track */
        }

        /* Firefox slider thumb */
        input.investment-slider::-moz-range-thumb {
          width: 1rem;
          height: 1rem;
          border-radius: 50%;
          background: ${fillColor};
          cursor: pointer;
          border: none;
        }
      `}</style>
    </>
  );
};

export default WeightGainForm;
