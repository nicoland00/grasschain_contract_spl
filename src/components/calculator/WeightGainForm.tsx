// src/components/calculator/ui/WeightGainForm.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/calculator/ui/card";
import { Button } from "@/components/calculator/ui/button";
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
  const minAmt = 2.5;
  const maxAmt = 10000;

  const [caloriesAmount, setCaloriesAmount] = useState(initialCaloriesAmount);
  const [projectionData, setProjectionData] = useState<any[]>([]);
  const [projectedWeight, setProjectedWeight] = useState(0);
  const [totalCalories, setTotalCalories] = useState(0);
  
  // price per kilogram
  const costPerKilogram = 2.5;
  // convert the USD amount into kilograms
  const meatKilograms = caloriesAmount / costPerKilogram;

  const formatter = (value: number) => `${value.toFixed(1)} kg`;

  const yAxisFormatter = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000)     return `${(value / 1_000).toFixed(0)}k`;
    return `${value}`;
  };

  useEffect(() => {
    const { data, finalProjectedWeight, finalCaloriesContribution } =
      calculateWeightGain({
        initialWeight,
        dailyCaloriesAmount: caloriesAmount,
        months: 36,
      });

    setProjectionData(data);
    setProjectedWeight(finalProjectedWeight);
    setTotalCalories(finalCaloriesContribution);
  }, [caloriesAmount, initialWeight]);

  // ─── compute fill percentage for the slider ───
  const fillPct = Math.min(
    100,
    Math.max(0, ((caloriesAmount - minAmt) / (maxAmt - minAmt)) * 100)
  );

  // ─── slider colors ───
  const fillColor = '#4ECCA3';
  const trackColor = '#E5E7EB';
  const borderColor = '#D1D5DB';

  return (
    <>
      <Card className="bg-appDarkGray border-border">
        <CardContent className="p-6">
          <div className="mb-6 animate-fade-in">
            <h2 className="text-3xl font-bold mb-1 text-black text-center">
              Avg. projected weight gain
            </h2>
            <div className="flex justify-between gap-8 mt-4 text-black">
              <WeightCard 
                title="Projected Weight" 
                value={formatter(projectedWeight)} 
                color={fillColor} 
              />
              <WeightCard 
                title="Your today's contributions" 
                value={`${meatKilograms.toFixed(1)} kg`} 
                color="#3A86FF" 
              />
            </div>
          </div>
          
          <WeightGainChart 
            data={projectionData} 
            yAxisFormatter={yAxisFormatter} 
          />
          
          <div className="mt-4">
            <div className="flex justify-between mb-2">
              <h3 className="text-xl font-bold text-black">
                Contribution amount
              </h3>
              <span className="text-xl font-bold text-black">
                {/* Display both kilograms and USD */}
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
          
          <div className="mt-4 text-center"> 
            <p className="text-xs text-muted-foreground mb-4 text-black">
              Simulated future weight projections are not a reliable indicator of actual results.
              Projected values are estimates based on general weight gain principles and vary based on individual factors.
              All values shown are estimates and individual results may vary.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ─── global styles for the range thumb ─── */}
      <style jsx global>{`
        /* track already styled inline */
        input.investment-slider:focus {
          outline: none;
        }
        input.investment-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 1rem;
          height: 1rem;
          border-radius: 50%;
          background: ${fillColor};
          cursor: pointer;
          margin-top: -0.25rem; /* center on 8px track */
        }
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
