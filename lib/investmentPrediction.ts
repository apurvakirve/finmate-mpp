import { RiskLevel } from '../app/(tabs)/RiskProfile';

export type InvestmentType = 'equity' | 'debt' | 'hybrid' | 'gold' | 'sip' | 'liquid';

export interface InvestmentFund {
  id: string;
  code: string;
  name: string;
  type: InvestmentType;
  category: string;
  riskLevel: 'low' | 'medium' | 'high';
  expectedReturn: number; // annual percentage
  historicalReturns?: {
    oneMonth: number;
    threeMonth: number;
    sixMonth: number;
    oneYear: number;
    threeYear: number;
  };
  expenseRatio: number;
  minInvestment: number;
  description: string;
  suitability: RiskLevel[]; // which risk profiles this suits
  growthFactors: string[]; // reasons why it's recommended
  concerns: string[]; // potential risks
  lockInPeriod?: number; // in years
  taxBenefits?: boolean;
}

export interface InvestmentPrediction {
  fund: InvestmentFund;
  predictedGrowth: {
    oneYear: number;
    threeYear: number;
    fiveYear: number;
  };
  confidence: number; // 0-100
  recommendationScore: number; // 0-100, higher is better
  reasons: {
    positive: string[];
    negative: string[];
  };
  sipProjection?: {
    monthlyAmount: number;
    years: number;
    projectedValue: number;
    totalInvested: number;
    estimatedReturns: number;
  };
}

/**
 * ML-like algorithm to predict investment growth
 * Uses historical data, market trends, and risk factors
 */
export function predictInvestmentGrowth(
  fund: InvestmentFund,
  historicalData?: Array<{ date: string; nav: number }>
): InvestmentPrediction {
  const baseReturn = fund.expectedReturn;
  const riskFactor = fund.riskLevel === 'high' ? 1.2 : fund.riskLevel === 'medium' ? 1.0 : 0.8;

  // Calculate volatility from historical data if available
  let volatility = 0.15; // default volatility
  if (historicalData && historicalData.length > 30) {
    const returns = [];
    for (let i = 1; i < Math.min(historicalData.length, 90); i++) {
      const prevNav = historicalData[i - 1].nav;
      const currNav = historicalData[i].nav;
      if (prevNav > 0) {
        returns.push((currNav - prevNav) / prevNav);
      }
    }
    if (returns.length > 0) {
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
      volatility = Math.sqrt(variance * 252); // annualized volatility
    }
  }

  // Adjust predictions based on fund type
  let typeMultiplier = 1.0;
  switch (fund.type) {
    case 'equity':
      typeMultiplier = 1.1;
      break;
    case 'gold':
      typeMultiplier = 0.9; // gold typically has lower but stable returns
      break;
    case 'debt':
      typeMultiplier = 0.85;
      break;
    case 'hybrid':
      typeMultiplier = 1.0;
      break;
    case 'liquid':
      typeMultiplier = 0.7;
      break;
  }

  // Predict growth with confidence intervals
  const oneYearPrediction = baseReturn * typeMultiplier * (1 + (volatility * 0.3));
  const threeYearPrediction = baseReturn * typeMultiplier * 3 * (1 - volatility * 0.2);
  const fiveYearPrediction = baseReturn * typeMultiplier * 5 * (1 - volatility * 0.15);

  // Calculate confidence based on data availability and fund stability
  let confidence = 70; // base confidence
  if (historicalData && historicalData.length > 180) confidence += 15;
  if (fund.historicalReturns) confidence += 10;
  if (volatility < 0.2) confidence += 5;
  confidence = Math.min(95, confidence);

  // Calculate recommendation score
  let score = 50;
  score += (baseReturn * 10); // higher returns = higher score
  score -= (volatility * 50); // lower volatility = higher score
  score += fund.riskLevel === 'low' ? 10 : fund.riskLevel === 'medium' ? 5 : 0;
  score = Math.max(0, Math.min(100, score));

  // Generate reasons
  const positive: string[] = [];
  const negative: string[] = [];

  if (baseReturn > 0.1) {
    positive.push(`Strong expected returns of ${(baseReturn * 100).toFixed(1)}% annually`);
  }
  if (volatility < 0.15) {
    positive.push('Low volatility indicates stable performance');
  }
  if (fund.expenseRatio < 0.02) {
    positive.push('Low expense ratio maximizes returns');
  }
  if (fund.type === 'equity' && baseReturn > 0.12) {
    positive.push('Equity funds offer high growth potential for long-term wealth creation');
  }
  if (fund.type === 'gold') {
    positive.push('Gold provides portfolio diversification and hedge against inflation');
  }
  if (fund.type === 'debt') {
    positive.push('Debt funds offer capital preservation with steady returns');
  }

  if (volatility > 0.25) {
    negative.push('High volatility may lead to significant short-term fluctuations');
  }
  if (fund.expenseRatio > 0.025) {
    negative.push('Higher expense ratio reduces net returns');
  }
  if (fund.riskLevel === 'high' && baseReturn < 0.12) {
    negative.push('High risk without corresponding high returns');
  }

  return {
    fund,
    predictedGrowth: {
      oneYear: Math.max(0, oneYearPrediction),
      threeYear: Math.max(0, threeYearPrediction),
      fiveYear: Math.max(0, fiveYearPrediction),
    },
    confidence,
    recommendationScore: score,
    reasons: {
      positive,
      negative,
    },
  };
}

/**
 * Calculate SIP projection
 */
export function calculateSipProjection(
  monthlyAmount: number,
  years: number,
  annualReturn: number
): {
  totalInvested: number;
  projectedValue: number;
  estimatedReturns: number;
} {
  const months = years * 12;
  const monthlyRate = annualReturn / 12;

  // Future value of SIP: FV = P * [((1 + r)^n - 1) / r] * (1 + r)
  // Guard against zero rate to avoid division by zero
  const growthFactor = monthlyRate === 0
    ? months
    : ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
  const futureValue = monthlyAmount * growthFactor;

  const totalInvested = monthlyAmount * months;
  const estimatedReturns = futureValue - totalInvested;

  return {
    totalInvested,
    projectedValue: futureValue,
    estimatedReturns,
  };
}

/**
 * Get investment recommendations based on risk level
 */
export function getRecommendationsByRiskLevel(riskLevel: RiskLevel): InvestmentFund[] {
  const allFunds: InvestmentFund[] = [
    // Conservative - Low Risk
    {
      id: 'gold-1',
      code: 'GOLD001',
      name: 'SBI Gold Fund - Direct Growth',
      type: 'gold',
      category: 'Gold ETF',
      riskLevel: 'low',
      expectedReturn: 0.08,
      expenseRatio: 0.005,
      minInvestment: 1000,
      description: 'Gold mutual fund providing exposure to gold prices, ideal for portfolio diversification.',
      suitability: ['conservative', 'moderate'],
      growthFactors: ['Inflation hedge', 'Portfolio diversification', 'Low correlation with equity'],
      concerns: ['No regular income', 'Price volatility'],
    },
    {
      id: 'debt-1',
      code: '119551',
      name: 'SBI Liquid Fund - Regular Plan',
      type: 'liquid',
      category: 'Debt - Liquid',
      riskLevel: 'low',
      expectedReturn: 0.055,
      expenseRatio: 0.0015,
      minInvestment: 5000,
      description: 'Ultra-low risk liquid fund for emergency corpus and short-term parking.',
      suitability: ['conservative'],
      growthFactors: ['Capital preservation', 'High liquidity', 'Stable returns'],
      concerns: ['Lower returns compared to equity'],
    },
    {
      id: 'debt-2',
      code: '118834',
      name: 'HDFC Short Term Debt Fund',
      type: 'debt',
      category: 'Debt - Short Duration',
      riskLevel: 'low',
      expectedReturn: 0.065,
      expenseRatio: 0.002,
      minInvestment: 5000,
      description: 'Short duration debt fund with limited volatility, suitable for conservative investors.',
      suitability: ['conservative', 'moderate'],
      growthFactors: ['Stable returns', 'Lower risk', 'Regular income'],
      concerns: ['Interest rate sensitivity'],
    },

    // Moderate - Medium Risk
    {
      id: 'hybrid-1',
      code: '118825',
      name: 'HDFC Hybrid Equity Fund',
      type: 'hybrid',
      category: 'Hybrid - Aggressive',
      riskLevel: 'medium',
      expectedReturn: 0.105,
      expenseRatio: 0.018,
      minInvestment: 1000,
      description: 'Balanced mix of equity and debt to balance growth and stability.',
      suitability: ['moderate', 'aggressive'],
      growthFactors: ['Balanced risk-return', 'Equity exposure with debt stability', 'Tax efficient'],
      concerns: ['Market volatility affects equity portion'],
    },
    {
      id: 'hybrid-2',
      code: '125354',
      name: 'ICICI Prudential Balanced Advantage Fund',
      type: 'hybrid',
      category: 'Hybrid - Dynamic Asset',
      riskLevel: 'medium',
      expectedReturn: 0.1,
      expenseRatio: 0.019,
      minInvestment: 1000,
      description: 'Dynamic asset allocation that manages downside risk while capturing upside.',
      suitability: ['moderate'],
      growthFactors: ['Dynamic allocation', 'Risk management', 'Flexible strategy'],
      concerns: ['Complex strategy', 'Management dependency'],
    },
    {
      id: 'sip-1',
      code: '118778',
      name: 'Axis Bluechip Fund - SIP',
      type: 'sip',
      category: 'Equity - Large Cap SIP',
      riskLevel: 'medium',
      expectedReturn: 0.12,
      expenseRatio: 0.016,
      minInvestment: 500,
      description: 'Systematic Investment Plan in large-cap equity fund for disciplined long-term investing.',
      suitability: ['moderate', 'aggressive'],
      growthFactors: ['Rupee cost averaging', 'Disciplined investing', 'Long-term wealth creation'],
      concerns: ['Market volatility', 'Long lock-in period'],
    },

    // Aggressive - High Risk
    {
      id: 'equity-1',
      code: '118778',
      name: 'Axis Bluechip Fund',
      type: 'equity',
      category: 'Equity - Large Cap',
      riskLevel: 'high',
      expectedReturn: 0.12,
      expenseRatio: 0.016,
      minInvestment: 5000,
      description: 'Large-cap focused equity fund for long-term growth potential.',
      suitability: ['aggressive', 'moderate'],
      growthFactors: ['High growth potential', 'Large-cap stability', 'Long-term wealth creation'],
      concerns: ['High volatility', 'Market risk', 'No guaranteed returns'],
    },
    {
      id: 'equity-2',
      code: '118540',
      name: 'Mirae Asset Emerging Bluechip Fund',
      type: 'equity',
      category: 'Equity - Large & Mid Cap',
      riskLevel: 'high',
      expectedReturn: 0.14,
      expenseRatio: 0.017,
      minInvestment: 5000,
      description: 'Blend of large and mid-cap stocks for higher growth potential.',
      suitability: ['aggressive'],
      growthFactors: ['High growth potential', 'Diversified across market caps', 'Strong track record'],
      concerns: ['High volatility', 'Mid-cap risk', 'Market dependency'],
    },
    {
      id: 'sip-2',
      code: '120464',
      name: 'Nippon India Small Cap Fund - SIP',
      type: 'sip',
      category: 'Equity - Small Cap SIP',
      riskLevel: 'high',
      expectedReturn: 0.16,
      expenseRatio: 0.019,
      minInvestment: 500,
      description: 'Aggressive SIP in small-cap fund for maximum growth potential.',
      suitability: ['aggressive'],
      growthFactors: ['Maximum growth potential', 'Small-cap advantage', 'Rupee cost averaging'],
      concerns: ['Very high volatility', 'Liquidity risk', 'Long investment horizon required'],
    },
  ];

  // Filter and sort by suitability
  return allFunds
    .filter(fund => fund.suitability.includes(riskLevel))
    .sort((a, b) => {
      // Map risk levels for comparison
      const targetRisk = riskLevel === 'conservative' ? 'low' :
        riskLevel === 'moderate' ? 'medium' : 'high';

      // Sort by recommendation score (would be calculated with predictions)
      if (a.riskLevel === targetRisk && b.riskLevel !== targetRisk) return -1;
      if (b.riskLevel === targetRisk && a.riskLevel !== targetRisk) return 1;
      return b.expectedReturn - a.expectedReturn;
    });
}

/**
 * Compare investments and rank them
 */
export function compareInvestments(
  predictions: InvestmentPrediction[]
): InvestmentPrediction[] {
  return [...predictions].sort((a, b) => {
    // Primary sort by recommendation score
    if (Math.abs(a.recommendationScore - b.recommendationScore) > 5) {
      return b.recommendationScore - a.recommendationScore;
    }
    // Secondary sort by 5-year predicted growth
    return b.predictedGrowth.fiveYear - a.predictedGrowth.fiveYear;
  });
}

