import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/calculator/ui/card";
import { Slider } from "@/components/calculator/ui/slider";
import { Button } from "@/components/calculator/ui/button";
import InvestmentChart from './InvestmentChart';
import InvestmentCard from './InvestmentCard';
import { calculateInvestmentGrowth } from '@/utils/investment';

interface InvestmentFormProps {
  initialInvestment?: number;
  initialMonthlyAmount?: number;
}

const InvestmentForm: React.FC<InvestmentFormProps> = ({ 
  initialInvestment = 0,
  initialMonthlyAmount = 150,
}) => {
  const [monthlyAmount, setMonthlyAmount] = useState(initialMonthlyAmount);
  const [investmentData, setInvestmentData] = useState<any[]>([]);
  const [projectedValue, setProjectedValue] = useState(0);
  const [totalContribution, setTotalContribution] = useState(0);

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  });

  const yAxisFormatter = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M €`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k €`;
    }
    return `${value} €`;
  };

  useEffect(() => {
    const { data, finalProjectedValue, finalContribution } = calculateInvestmentGrowth({
      initialInvestment,
      monthlyContribution: monthlyAmount,
      years: 20,
      returnRate: 8
    });

    setInvestmentData(data);
    setProjectedValue(finalProjectedValue);
    setTotalContribution(finalContribution);
  }, [monthlyAmount, initialInvestment]);

  return (
    <Card className="bg-appDarkGray border-border w-full max-w-lg mx-auto">
      <CardContent className="p-6">
        <div className="mb-6 animate-fade-in">
          <h2 className="text-2xl font-bold mb-1">Avg. projected value by 2045</h2>
          <div className="flex justify-between gap-8 mt-4">
            <InvestmentCard 
              title="Projected value" 
              value={formatter.format(projectedValue)} 
              color="#4ECCA3" 
            />
            <InvestmentCard 
              title="Your contribution" 
              value={formatter.format(totalContribution)} 
              color="#3A86FF" 
            />
          </div>
        </div>
        
        <InvestmentChart data={investmentData} yAxisFormatter={yAxisFormatter} />
        
        <div className="mt-4">
          <div className="flex justify-between mb-2">
            <h3 className="text-xl font-bold">Monthly amount</h3>
            <span className="text-xl font-bold">{formatter.format(monthlyAmount)}</span>
          </div>
          
          <input
            type="range"
            min="1"
            max="1000"
            value={monthlyAmount}
            onChange={(e) => setMonthlyAmount(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer investment-slider"
          />
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-xs text-muted-foreground mb-8">
            Simulated future projections are not a reliable indicator or guarantee of future performance.
            Projected values are forecasts based on actual historical data of ETF you've chosen and are for
            informational purposes only. All values shown are before taxes and fees.
          </p>
          
          <Button className="w-full py-6 text-lg font-semibold rounded-full bg-white text-black hover:bg-gray-200">
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvestmentForm;
