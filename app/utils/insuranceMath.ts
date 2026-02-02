// Simple mortality curve estimation for Canada (Non-Smoker)
// Base rates per $1,000 of coverage
const BASE_COI = {
  male: 0.12, // Starting rate at age 0 (very low)
  female: 0.08
};

export const calculateULProjection = (
  age: number,
  gender: 'male' | 'female',
  smoking: boolean,
  faceAmount: number,
  annualDeposit: number,
  yearsToPay: number,
  returnRate: number,
  projectionYears: number = 50
) => {
  let currentAge = age;
  let cashValue = 0;
  let totalPremiums = 0;
  const results = [];

  // Smoking Multiplier (Standard roughly 2x)
  const riskMultiplier = smoking ? 2.1 : 1.0;
  
  // Gender Multiplier (Females live longer, lower rates)
  const genderBase = gender === 'male' ? BASE_COI.male : BASE_COI.female;

  for (let year = 1; year <= projectionYears; year++) {
    const isPaying = year <= yearsToPay;
    const premiumIn = isPaying ? annualDeposit : 0;
    
    // 1. Premium Tax (Approx 2% in most provinces)
    const netPremium = premiumIn * 0.98; 
    
    // 2. Add to Cash Value (Pre-Growth)
    cashValue += netPremium;
    totalPremiums += premiumIn;

    // 3. Calculate COI (Cost of Insurance)
    // Formula: Rate increases exponentially with age (~8-10% per year)
    // This mimics a YRT curve.
    const coiRatePer1000 = (genderBase * Math.pow(1.095, currentAge)) * riskMultiplier;
    const annualCOI = (faceAmount / 1000) * coiRatePer1000;
    
    // 4. Deduct COI
    // (If Cash Value hits 0, policy lapses)
    cashValue -= annualCOI;

    // 5. Investment Growth (Compound Interest)
    // Growth applies to the Cash Value AFTER deductions
    const growth = cashValue * (returnRate / 100);
    cashValue += growth;

    // Safety Floor
    if (cashValue < 0) cashValue = 0;

    // 6. Total Death Benefit (Option B: Face Plus Fund)
    // The payout is the Insurance Amount + The Accumulated Cash
    const deathBenefit = faceAmount + cashValue;

    results.push({
      age: currentAge,
      year,
      premium: premiumIn,
      totalPremiums,
      coi: annualCOI,
      cashValue,
      deathBenefit
    });

    currentAge++;
  }

  return results;
};