
import React from 'react';
import WeightGainForm from './WeightGainForm';
import PastoraLogo from './PastoraLogo';
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
    <div className="min-h-screen bg-appBlack text-white p-4">
      <div className="max-w-lg mx-auto">
        <WeightGainForm initialWeight={200} initialCaloriesAmount={150} />
      </div>
    </div>
  );
};

export default WeightGainProjection;
