
import React from 'react';
import { Card, CardContent } from "@/components/calculator/ui/card";

interface InvestmentCardProps {
  title: string;
  value: string;
  color: string;
}

const InvestmentCard: React.FC<InvestmentCardProps> = ({ title, value, color }) => {
  return (
    <div className="flex items-start gap-2">
      <div className={`w-3 h-3 rounded-sm mt-1.5`} style={{ backgroundColor: color }}></div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-m font-semibold">{value}</p>
      </div>
    </div>
  );
};

export default InvestmentCard;
