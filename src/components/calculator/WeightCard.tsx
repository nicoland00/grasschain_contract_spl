
import React from 'react';
import { Card, CardContent } from "@/components/calculator/ui/card";

interface WeightCardProps {
  title: string;
  value: string;
  color: string;
}

const WeightCard: React.FC<WeightCardProps> = ({ title, value, color }) => {
  return (
    <div className="flex items-start gap-2">
      <div className={`w-3 h-3 rounded-sm mt-1.5`} style={{ backgroundColor: color }}></div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-xl font-semibold">{value}</p>
      </div>
    </div>
  );
};

export default WeightCard;
