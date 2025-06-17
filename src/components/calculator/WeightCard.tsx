import React from 'react';
import { Card, CardContent } from "@/components/calculator/ui/card";

interface WeightCardProps {
  title: string;
  value: string;
  color: string;
  className?: string;
}

const WeightCard: React.FC<WeightCardProps> = ({ title, value, color, className }) => {
  return (
    <div className={`flex items-start gap-2 ${className || ''}`}>
      <div className={`w-3 h-3 rounded-sm mt-1.5`} style={{ backgroundColor: color }}></div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-l font-semibold">{value}</p>
      </div>
    </div>
  );
};

export default WeightCard;
