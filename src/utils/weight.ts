// src/utils/weight.ts

export interface GainParams {
  initialWeight: number;       // e.g. 200 kg
  dailyCaloriesAmount: number; // $ you pay one‐time
  months: number;              // e.g. 36
}

export interface GainResult {
  data: Array<{
    month: number;
    projectedWeight: number;       // your share in kg
    caloriesContribution: number;  // your share in kg
  }>;
  finalProjectedWeight: number;    // your share at end
  finalCaloriesContribution: number;
}

export const calculateWeightGain = ({
  initialWeight = 200,
  dailyCaloriesAmount,
  months,
}: GainParams): GainResult => {
  const costPerKilogram = 2.5;                     // $2.5 per kg
  const meatKilograms = dailyCaloriesAmount / costPerKilogram;

  // what fraction of the animal you own
  const shareRatio = meatKilograms / initialWeight;

  // track the animal’s weight over time
  let animalWeight = initialWeight;
  const data: GainResult['data'] = [];

  // Month 0
  data.push({
    month: 0,
    projectedWeight: parseFloat((shareRatio * animalWeight).toFixed(1)),
    caloriesContribution: parseFloat(meatKilograms.toFixed(1)),
  });

  // Months 1 → months
  for (let m = 1; m <= months; m++) {
    let dailyGain: number;
    if (m <= 12) dailyGain = 0.320;
    else if (m <= 18) dailyGain = 0.420;
    else if (m <= 24) dailyGain = 0.460;
    else dailyGain = 0.480;

    animalWeight += dailyGain * 30; // 30 days per month

    data.push({
      month: m,
      projectedWeight: parseFloat((shareRatio * animalWeight).toFixed(1)),
      caloriesContribution: parseFloat(meatKilograms.toFixed(1)),
    });
  }

  const finalShare = parseFloat((shareRatio * animalWeight).toFixed(1));
  return {
    data,
    finalProjectedWeight: finalShare,
    finalCaloriesContribution: parseFloat(meatKilograms.toFixed(1)),
  };
};
