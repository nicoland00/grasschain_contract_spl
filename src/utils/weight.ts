// src/utils/weight.ts

export interface GainParams {
  initialWeight: number;       // e.g. 200 kg
  dailyCaloriesAmount: number; // $ you pay one-time
  months: number;              // e.g. 36
}

export interface GainResult {
  data: Array<{
    month: number;
    projectedWeight: number;       // your share in kg
    caloriesContribution: number;  // your share in kg
    lower10: number;               // 90 % of projectedWeight
    range10: number;               // (110 %–90 %) of projectedWeight
    lower20: number;               // 80 % of projectedWeight
    range20: number;               // (120 %–80 %) of projectedWeight
  }>;
  finalProjectedWeight: number;
  finalCaloriesContribution: number;
}

export const calculateWeightGain = ({
  initialWeight = 200,
  dailyCaloriesAmount,
  months,
}: GainParams): GainResult => {
  const costPerKilogram = 2.5;
  const meatKilograms    = dailyCaloriesAmount / costPerKilogram;
  const shareRatio       = meatKilograms / initialWeight;

  let animalWeight = initialWeight;
  const data: GainResult["data"] = [];

  function pushPoint(m: number) {
    const proj   = parseFloat((shareRatio * animalWeight).toFixed(1));
    const l10    = parseFloat((proj * 0.9).toFixed(1));
    const u10    = parseFloat((proj * 1.1).toFixed(1));
    const l20    = parseFloat((proj * 0.75).toFixed(1));
    const u20    = parseFloat((proj * 1.25).toFixed(1));

    data.push({
      month: m,
      projectedWeight: proj,
      caloriesContribution: parseFloat(meatKilograms.toFixed(1)),
      lower10: l10,
      range10: parseFloat((u10 - l10).toFixed(1)),
      lower20: l20,
      range20: parseFloat((u20 - l20).toFixed(1)),
    });
  }

  // Month 0
  pushPoint(0);

  // Months 1…months
  for (let m = 1; m <= months; m++) {
    let dailyGain: number;
    if (m <= 12)      dailyGain = 0.320;
    else if (m <= 18) dailyGain = 0.420;
    else if (m <= 24) dailyGain = 0.460;
    else               dailyGain = 0.480;

    animalWeight += dailyGain * 30; // approx
    pushPoint(m);
  }

  const finalProj = data[data.length - 1].projectedWeight;
  return {
    data,
    finalProjectedWeight: finalProj,
    finalCaloriesContribution: parseFloat(meatKilograms.toFixed(1)),
  };
};
