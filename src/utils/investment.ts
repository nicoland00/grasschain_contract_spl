
interface GrowthParams {
  initialInvestment: number;
  monthlyContribution: number;
  years: number;
  returnRate: number;
}

interface GrowthResult {
  data: Array<{
    year: number;
    projectedValue: number;
    contribution: number;
  }>;
  finalProjectedValue: number;
  finalContribution: number;
}

export const calculateInvestmentGrowth = ({
  initialInvestment,
  monthlyContribution,
  years,
  returnRate
}: GrowthParams): GrowthResult => {
  const annualReturnRate = returnRate / 100;
  const monthlyReturnRate = Math.pow(1 + annualReturnRate, 1/12) - 1;
  const totalMonths = years * 12;
  
  const currentDate = new Date();
  const startYear = currentDate.getFullYear();
  
  let currentValue = initialInvestment;
  let totalContribution = initialInvestment;
  const data: GrowthResult['data'] = [];
  
  // Calculate values for each year
  for (let year = 0; year <= years; year++) {
    // If it's the first year, just add the initial values
    if (year === 0) {
      data.push({
        year: startYear + year,
        projectedValue: currentValue,
        contribution: totalContribution,
      });
      continue;
    }
    
    // Calculate 12 months of growth for this year
    for (let month = 0; month < 12; month++) {
      currentValue = currentValue * (1 + monthlyReturnRate) + monthlyContribution;
      totalContribution += monthlyContribution;
    }
    
    // Record the year's end values
    data.push({
      year: startYear + year,
      projectedValue: Math.round(currentValue),
      contribution: Math.round(totalContribution),
    });
  }
  
  return {
    data,
    finalProjectedValue: Math.round(currentValue),
    finalContribution: Math.round(totalContribution)
  };
};
