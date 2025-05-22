
import React from 'react';
import InvestmentForm from './InvestmentForm';
import { ArrowLeft } from "lucide-react";

interface InvestmentPlanProps {
  ticker?: string;
  name?: string;
}

const InvestmentPlan: React.FC<InvestmentPlanProps> = ({
  ticker = "VUAA",
  name = "Vanguard S&P 500 UCITS ETF (Acc)",
}) => {
  return (
      <div className="max-w-lg mx-auto">
        <div className="flex items-center mb-8">
          <button className="p-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-1">Investment Plan</h1>
            <p className="text-lg text-gray-300">{ticker} · {name}</p>
          </div>
        </div>
        
        <InvestmentForm initialMonthlyAmount={150} />
      </div>
  );
};

export default InvestmentPlan;
