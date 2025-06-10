
import React from 'react';
import WeightGainForm from './WeightGainForm';
import { ArrowLeft } from "lucide-react";

interface WeightGainProjectionProps {
  programName?: string;
  description?: string;
}

const WeightGainProjection: React.FC<WeightGainProjectionProps> = ({
  programName = "Mass Gain",
  description = "Pastora Weight Gain Program",
}) => {
  return (
    <div className="min-h-screen bg-appBlack text-white mx-4 md:mx-auto">
        <WeightGainForm initialWeight={200} initialCaloriesAmount={150} />
    </div>
  );
};

export default WeightGainProjection;
