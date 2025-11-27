import { RiskLevel } from '../app/(tabs)/RiskProfile';
import { SpiritAnimalType } from '../types/spiritAnimal';
import { FundSearchService } from './FundSearchService';
import { getRecommendationsByRiskLevel, InvestmentFund, InvestmentPrediction, predictInvestmentGrowth } from './investmentPrediction';

export interface InvestmentInsight {
    type: 'tip' | 'warning' | 'kudos' | 'alert';
    title: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
    fundId?: string;
    actionable?: boolean;
    actionLabel?: string;
}

export interface PortfolioAnalysis {
    healthScore: number; // 0-100
    diversificationScore: number; // 0-100
    riskAlignment: 'aligned' | 'too-conservative' | 'too-aggressive';
    suggestions: string[];
    strengths: string[];
    concerns: string[];
    allocationBreakdown: {
        equity: number;
        debt: number;
        gold: number;
        hybrid: number;
        liquid: number;
    };
}

export interface AIFundRecommendation {
    fund: InvestmentFund;
    prediction: InvestmentPrediction;
    score: number; // 0-100
    reasoning: string[];
    tags: ('top-pick' | 'rising-star' | 'stable-performer' | 'high-growth')[];
    sipSuggestion: number;
    allocationPercentage: number; // Percentage of total investment capacity
}

export interface IncomeAnalysis {
    averageMonthlyIncome: number;
    averageMonthlySavings: number;
    investmentJarBalance: number;
    recommendedMonthlyInvestment: number;
    canAfford: boolean;
    savingsRate: number; // percentage
}

export interface PersonalityInvestmentStrategy {
    spiritAnimal: SpiritAnimalType;
    preferredAssetMix: { equity: number; debt: number; gold: number; hybrid: number; liquid: number };
    investmentHorizon: number; // years
    rebalanceFrequency: 'monthly' | 'quarterly' | 'yearly';
    communicationStyle: string;
    specificAdvice: string[];
    riskAppetite: string;
}

interface UserInvestmentProfile {
    riskLevel: RiskLevel;
    spiritAnimal?: SpiritAnimalType;
    monthlyInvestmentCapacity: number;
    investmentHorizon: number; // years
    goals: string[];
    selectedFunds: string[];
    preferences: {
        preferredTypes: string[];
        avoidTypes: string[];
    };
}

/**
 * Agentic Investment Coach
 * Provides AI-powered investment recommendations, portfolio analysis, and interactive guidance
 */
export class AgenticInvestmentCoach {
    private userId: string;
    private userProfile: UserInvestmentProfile;
    private learningData: {
        fundSelections: Map<string, number>; // fundId -> selection count
        rejections: Map<string, number>; // fundId -> rejection count
        averageSipAmount: number;
    };

    constructor(userId: string) {
        this.userId = userId;
        this.userProfile = {
            riskLevel: 'moderate',
            monthlyInvestmentCapacity: 5000,
            investmentHorizon: 5,
            goals: [],
            selectedFunds: [],
            preferences: {
                preferredTypes: [],
                avoidTypes: [],
            },
        };
        this.learningData = {
            fundSelections: new Map(),
            rejections: new Map(),
            averageSipAmount: 5000,
        };
    }

    /**
     * Get personality-based investment strategy
     */
    getPersonalityStrategy(spiritAnimal: SpiritAnimalType): PersonalityInvestmentStrategy {
        const strategies: Record<SpiritAnimalType, PersonalityInvestmentStrategy> = {
            eagle: {
                spiritAnimal: 'eagle',
                preferredAssetMix: { equity: 70, debt: 15, gold: 10, hybrid: 5, liquid: 0 },
                investmentHorizon: 10,
                rebalanceFrequency: 'yearly',
                communicationStyle: 'Focus on long-term wealth creation and growth opportunities',
                specificAdvice: [
                    'Prioritize high-growth equity funds',
                    'Think in decades, not years',
                    'Diversify across sectors for strategic growth',
                    'Review portfolio annually, avoid frequent changes'
                ],
                riskAppetite: 'High - You understand calculated risks lead to rewards'
            },
            squirrel: {
                spiritAnimal: 'squirrel',
                preferredAssetMix: { equity: 30, debt: 50, gold: 10, hybrid: 0, liquid: 10 },
                investmentHorizon: 5,
                rebalanceFrequency: 'quarterly',
                communicationStyle: 'Emphasize safety, stability, and capital preservation',
                specificAdvice: [
                    'Focus on low-risk debt and liquid funds',
                    'Build emergency fund first',
                    'Choose funds with proven track records',
                    'Avoid high volatility investments'
                ],
                riskAppetite: 'Low - Safety and security are your priorities'
            },
            butterfly: {
                spiritAnimal: 'butterfly',
                preferredAssetMix: { equity: 50, debt: 20, gold: 20, hybrid: 10, liquid: 0 },
                investmentHorizon: 5,
                rebalanceFrequency: 'quarterly',
                communicationStyle: 'Balance growth with flexibility and freedom',
                specificAdvice: [
                    'Choose funds with no lock-in periods',
                    'Maintain liquidity for spontaneous opportunities',
                    'Balanced approach to enjoy life while building wealth',
                    'SIP allows you to invest without restricting lifestyle'
                ],
                riskAppetite: 'Medium-High - Comfortable with moderate risks for experiences'
            },
            lion: {
                spiritAnimal: 'lion',
                preferredAssetMix: { equity: 60, debt: 25, gold: 10, hybrid: 5, liquid: 0 },
                investmentHorizon: 7,
                rebalanceFrequency: 'quarterly',
                communicationStyle: 'Align investments with specific goals and milestones',
                specificAdvice: [
                    'Set clear investment goals with timelines',
                    'Choose funds that match your goal horizons',
                    'Track progress monthly',
                    'Adjust allocations as you achieve milestones'
                ],
                riskAppetite: 'Medium - Goal-focused, calculated approach'
            },
            capybara: {
                spiritAnimal: 'capybara',
                preferredAssetMix: { equity: 50, debt: 30, gold: 10, hybrid: 10, liquid: 0 },
                investmentHorizon: 7,
                rebalanceFrequency: 'quarterly',
                communicationStyle: 'Provide balanced, adaptable strategies',
                specificAdvice: [
                    'Maintain perfect balance across asset types',
                    'Stay flexible with market conditions',
                    'Diversify to manage all scenarios',
                    'Adapt strategy as life changes'
                ],
                riskAppetite: 'Medium - Balanced approach to risk and reward'
            },
            fox: {
                spiritAnimal: 'fox',
                preferredAssetMix: { equity: 45, debt: 35, gold: 15, hybrid: 5, liquid: 0 },
                investmentHorizon: 7,
                rebalanceFrequency: 'monthly',
                communicationStyle: 'Optimize for maximum value and efficiency',
                specificAdvice: [
                    'Choose funds with lowest expense ratios',
                    'Maximize tax benefits (ELSS, 80C)',
                    'Rebalance monthly for optimal allocation',
                    'Research and compare before every decision'
                ],
                riskAppetite: 'Medium-Low - Minimize risk, maximize returns'
            }
        };

        return strategies[spiritAnimal];
    }

    /**
     * Get personality-specific reasoning for why a fund is suitable
     */
    private getPersonalityFundReasoning(
        fund: InvestmentFund,
        spiritAnimal: SpiritAnimalType,
        prediction: InvestmentPrediction
    ): string[] {
        const reasoning: string[] = [];

        switch (spiritAnimal) {
            case 'eagle':
                if (fund.type === 'equity' || fund.type === 'sip') {
                    reasoning.push('🦅 High growth potential aligns with your visionary mindset');
                }
                if (prediction.predictedGrowth.threeYear > 0.3) {
                    reasoning.push('🦅 Long-term horizon matches your patient investment style');
                }
                if (fund.riskLevel === 'high' || fund.riskLevel === 'medium') {
                    reasoning.push('🦅 Calculated risk fits your strategic approach');
                }
                break;

            case 'squirrel':
                if (fund.type === 'debt' || fund.type === 'liquid') {
                    reasoning.push('🐿️ Low volatility provides the security you value');
                }
                if (fund.riskLevel === 'low') {
                    reasoning.push('🐿️ Capital preservation protects your savings');
                }
                if (prediction.confidence > 80) {
                    reasoning.push('🐿️ Proven track record gives peace of mind');
                }
                break;

            case 'butterfly':
                if (!fund.lockInPeriod || fund.lockInPeriod === 0) {
                    reasoning.push('🦋 No lock-in period maintains your freedom');
                }
                if (fund.type === 'hybrid') {
                    reasoning.push('🦋 Balanced growth supports future experiences');
                }
                if (fund.riskLevel === 'medium') {
                    reasoning.push('🦋 Moderate risk allows for adventure with safety net');
                }
                break;

            case 'lion':
                if (fund.type === 'equity' && prediction.predictedGrowth.threeYear > 0.25) {
                    reasoning.push('🦁 Strong growth helps achieve your goals faster');
                }
                if (fund.riskLevel === 'medium' || fund.riskLevel === 'high') {
                    reasoning.push('🦁 Goal-focused risk aligns with your determined approach');
                }
                reasoning.push('🦁 Systematic investment keeps you on track to milestones');
                break;

            case 'capybara':
                if (fund.type === 'hybrid') {
                    reasoning.push('🦫 Perfect balance of growth and stability');
                }
                if (fund.riskLevel === 'medium') {
                    reasoning.push('🦫 Moderate risk matches your balanced philosophy');
                }
                reasoning.push('🦫 Flexible strategy adapts to your changing needs');
                break;

            case 'fox':
                if (fund.expenseRatio && fund.expenseRatio < 1.5) {
                    reasoning.push('🦊 Low expense ratio maximizes your returns');
                }
                if (fund.type === 'equity' && fund.taxBenefits) {
                    reasoning.push('🦊 Tax benefits optimize your overall gains');
                }
                if (prediction.recommendationScore > 80) {
                    reasoning.push('🦊 High AI score confirms this is a smart choice');
                }
                break;
        }

        return reasoning;
    }

    /**
     * Initialize the coach with user's risk profile
     */
    async initialize(riskLevel: RiskLevel): Promise<void> {
        this.userProfile.riskLevel = riskLevel;
        // Load user preferences from storage if needed
        return Promise.resolve();
    }

    /**
     * Analyze user's income and savings pattern from transaction history
     */
    async analyzeUserIncome(transactions: any[], investmentJarBalance: number): Promise<IncomeAnalysis> {
        // Calculate average monthly income from last 3 months
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const recentTransactions = transactions.filter(t =>
            new Date(t.date) >= threeMonthsAgo
        );

        // Calculate income (credits/deposits)
        const incomeTransactions = recentTransactions.filter(t =>
            t.type === 'credit' || t.amount > 0
        );
        const totalIncome = incomeTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const averageMonthlyIncome = totalIncome / 3;

        // Calculate expenses (debits)
        const expenseTransactions = recentTransactions.filter(t =>
            t.type === 'debit' || t.amount < 0
        );
        const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const averageMonthlyExpenses = totalExpenses / 3;

        // Calculate savings
        const averageMonthlySavings = averageMonthlyIncome - averageMonthlyExpenses;
        const savingsRate = averageMonthlyIncome > 0
            ? (averageMonthlySavings / averageMonthlyIncome) * 100
            : 0;

        // Recommend 60-70% of monthly savings for investment (keep buffer for emergencies)
        const recommendedMonthlyInvestment = Math.max(
            500, // Minimum 500 Rs
            Math.min(
                investmentJarBalance, // Don't exceed jar balance
                Math.floor(averageMonthlySavings * 0.65) // 65% of savings
            )
        );

        const canAfford = investmentJarBalance >= recommendedMonthlyInvestment;

        return {
            averageMonthlyIncome,
            averageMonthlySavings,
            investmentJarBalance,
            recommendedMonthlyInvestment,
            canAfford,
            savingsRate,
        };
    }

    /**
     * Analyze user's portfolio and provide health metrics
     */
    analyzePortfolio(selectedFunds: InvestmentFund[]): PortfolioAnalysis {
        const analysis: PortfolioAnalysis = {
            healthScore: 70,
            diversificationScore: 60,
            riskAlignment: 'aligned',
            suggestions: [],
            strengths: [],
            concerns: [],
            allocationBreakdown: {
                equity: 0,
                debt: 0,
                gold: 0,
                hybrid: 0,
                liquid: 0,
            },
        };

        if (selectedFunds.length === 0) {
            analysis.healthScore = 0;
            analysis.diversificationScore = 0;
            analysis.suggestions.push('Start building your portfolio by selecting funds that match your risk profile');
            return analysis;
        }

        // Calculate allocation breakdown
        const totalFunds = selectedFunds.length;
        selectedFunds.forEach(fund => {
            const weight = 1 / totalFunds;
            // Treat SIP as equity for allocation purposes
            const allocationType = fund.type === 'sip' ? 'equity' : fund.type;
            if (allocationType in analysis.allocationBreakdown) {
                analysis.allocationBreakdown[allocationType as keyof typeof analysis.allocationBreakdown] += weight * 100;
            }
        });

        // Calculate diversification score
        const typeCount = Object.values(analysis.allocationBreakdown).filter(v => v > 0).length;
        analysis.diversificationScore = Math.min(100, typeCount * 25);

        // Check risk alignment
        const highRiskCount = selectedFunds.filter(f => f.riskLevel === 'high').length;
        const lowRiskCount = selectedFunds.filter(f => f.riskLevel === 'low').length;
        const totalCount = selectedFunds.length;

        if (this.userProfile.riskLevel === 'conservative' && highRiskCount / totalCount > 0.3) {
            analysis.riskAlignment = 'too-aggressive';
            analysis.concerns.push('Your portfolio has too many high-risk funds for a conservative profile');
            analysis.healthScore -= 15;
        } else if (this.userProfile.riskLevel === 'aggressive' && lowRiskCount / totalCount > 0.5) {
            analysis.riskAlignment = 'too-conservative';
            analysis.concerns.push('Your portfolio is too conservative for an aggressive risk profile');
            analysis.healthScore -= 10;
        }

        // Evaluate diversification
        if (typeCount >= 3) {
            analysis.strengths.push('Well-diversified across multiple asset types');
            analysis.healthScore += 10;
        } else if (typeCount === 1) {
            analysis.concerns.push('Portfolio lacks diversification - consider adding different asset types');
            analysis.healthScore -= 20;
        }

        // Check for equity exposure
        if (analysis.allocationBreakdown.equity > 0) {
            analysis.strengths.push('Good equity exposure for long-term growth');
        } else if (this.userProfile.riskLevel !== 'conservative') {
            analysis.suggestions.push('Consider adding equity funds for higher growth potential');
        }

        // Check for debt/liquid for stability
        const stableAllocation = analysis.allocationBreakdown.debt + analysis.allocationBreakdown.liquid;
        if (stableAllocation > 20) {
            analysis.strengths.push('Adequate stable investments for capital preservation');
        } else if (this.userProfile.riskLevel === 'conservative') {
            analysis.suggestions.push('Add more debt or liquid funds for stability');
        }

        // Gold for diversification
        if (analysis.allocationBreakdown.gold > 0) {
            analysis.strengths.push('Gold provides hedge against inflation');
        } else if (typeCount < 3) {
            analysis.suggestions.push('Consider adding gold for better diversification');
        }

        // Ensure health score is within bounds
        analysis.healthScore = Math.max(0, Math.min(100, analysis.healthScore));

        return analysis;
    }

    /**
     * Generate AI-powered fund recommendations
     */
    async generateRecommendations(
        riskLevel: RiskLevel,
        monthlyCapacity: number = 5000,
        historicalData?: Map<string, Array<{ date: string; nav: number }>>
    ): Promise<AIFundRecommendation[]> {
        const baseFunds = getRecommendationsByRiskLevel(riskLevel);
        const scoredRecommendations: Partial<AIFundRecommendation>[] = [];

        // 1. Score all funds
        for (const fund of baseFunds) {
            const fundHistory = historicalData?.get(fund.code);
            const prediction = predictInvestmentGrowth(fund, fundHistory);

            let score = prediction.recommendationScore;

            // Boost score for previously selected funds (learning)
            const selectionCount = this.learningData.fundSelections.get(fund.id) || 0;
            const rejectionCount = this.learningData.rejections.get(fund.id) || 0;
            if (selectionCount > rejectionCount) {
                score += Math.min(15, selectionCount * 3);
            }

            // Adjust for user preferences
            if (this.userProfile.preferences.preferredTypes.includes(fund.type)) {
                score += 10;
            }
            if (this.userProfile.preferences.avoidTypes.includes(fund.type)) {
                score -= 20;
            }

            // Generate reasoning
            const reasoning: string[] = [...prediction.reasons.positive];

            // Add personalized reasoning
            if (fund.riskLevel === 'low' && riskLevel === 'conservative') {
                reasoning.push('Matches your conservative risk profile perfectly');
            } else if (fund.riskLevel === 'high' && riskLevel === 'aggressive') {
                reasoning.push('Aligned with your aggressive growth strategy');
            }

            if (fund.minInvestment <= monthlyCapacity) {
                reasoning.push('Fits within your investment budget');
            }

            // Add personality-specific reasoning
            if (this.userProfile.spiritAnimal) {
                const personalityReasoning = this.getPersonalityFundReasoning(
                    fund,
                    this.userProfile.spiritAnimal,
                    prediction
                );
                reasoning.push(...personalityReasoning);
            }

            // Assign tags
            const tags: AIFundRecommendation['tags'] = [];
            if (score >= 85) tags.push('top-pick');
            if (prediction.predictedGrowth.oneYear > 0.15) tags.push('high-growth');
            if (fund.riskLevel === 'low' && prediction.confidence > 80) tags.push('stable-performer');
            if (fund.type === 'equity' && prediction.predictedGrowth.threeYear > 0.35) tags.push('rising-star');

            scoredRecommendations.push({
                fund,
                prediction,
                score: Math.min(100, score),
                reasoning,
                tags,
            });
        }

        // 2. Sort and Select Top Funds
        scoredRecommendations.sort((a, b) => (b.score || 0) - (a.score || 0));

        // Determine how many funds we can support (min 500 per fund)
        // If capacity is very low (< 500), suggest at least one fund but warn user
        const maxFunds = Math.max(1, Math.floor(monthlyCapacity / 500));

        // Select top funds (max 5 or limited by budget)
        const selectedFunds = scoredRecommendations.slice(0, Math.min(5, maxFunds));

        // 3. Distribute Budget Smartly
        const totalScore = selectedFunds.reduce((sum, item) => sum + (item.score || 0), 0);

        return selectedFunds.map(item => {
            // Calculate share based on score
            const allocationShare = (item.score || 0) / totalScore;

            // Calculate SIP amount (round to nearest 100)
            let sipAmount = Math.floor((monthlyCapacity * allocationShare) / 100) * 100;

            // Ensure minimum investment (usually 500 for most funds)
            if (sipAmount < 500) sipAmount = 500;

            // Cap at monthly capacity if single fund
            if (sipAmount > monthlyCapacity) sipAmount = monthlyCapacity;

            return {
                ...item,
                sipSuggestion: sipAmount,
                allocationPercentage: Math.round(allocationShare * 100)
            } as AIFundRecommendation;
        });
    }

    /**
     * Generate actionable insights about investments
     */
    generateInsights(
        selectedFunds: InvestmentFund[],
        portfolioAnalysis: PortfolioAnalysis
    ): InvestmentInsight[] {
        const insights: InvestmentInsight[] = [];

        // Portfolio health insights
        if (portfolioAnalysis.healthScore >= 80) {
            insights.push({
                type: 'kudos',
                title: 'Excellent Portfolio Health',
                message: `Your portfolio scores ${portfolioAnalysis.healthScore}/100. Keep up the great work!`,
                priority: 'low',
            });
        } else if (portfolioAnalysis.healthScore < 50) {
            insights.push({
                type: 'warning',
                title: 'Portfolio Needs Attention',
                message: `Your portfolio health is ${portfolioAnalysis.healthScore}/100. Consider rebalancing based on our suggestions.`,
                priority: 'high',
                actionable: true,
                actionLabel: 'View Suggestions',
            });
        }

        // Diversification insights
        if (portfolioAnalysis.diversificationScore < 50) {
            insights.push({
                type: 'tip',
                title: 'Improve Diversification',
                message: 'Your portfolio is concentrated in few asset types. Diversifying can reduce risk and improve returns.',
                priority: 'medium',
                actionable: true,
                actionLabel: 'See Recommendations',
            });
        }

        // Risk alignment insights
        if (portfolioAnalysis.riskAlignment === 'too-aggressive') {
            insights.push({
                type: 'alert',
                title: 'Risk Mismatch Detected',
                message: 'Your portfolio is more aggressive than your risk profile. Consider adding stable funds.',
                priority: 'high',
            });
        } else if (portfolioAnalysis.riskAlignment === 'too-conservative') {
            insights.push({
                type: 'tip',
                title: 'Growth Opportunity',
                message: 'Your portfolio could benefit from more growth-oriented funds based on your risk tolerance.',
                priority: 'medium',
            });
        }

        // Market timing insights (simplified)
        const currentMonth = new Date().getMonth();
        if (currentMonth === 0 || currentMonth === 3) {
            insights.push({
                type: 'tip',
                title: 'Tax-Saving Opportunity',
                message: 'Consider ELSS funds for tax benefits under Section 80C while building wealth.',
                priority: 'medium',
            });
        }

        return insights;
    }

    /**
     * Answer user questions about investments
     */
    async answerQuestion(question: string, context: {
        selectedFunds: InvestmentFund[];
        riskLevel: RiskLevel;
        spiritAnimal?: SpiritAnimalType;
    }): Promise<string> {
        const lowerQ = question.toLowerCase();
        const spiritAnimal = context.spiritAnimal;

        // Personality-specific prefixes
        const prefixes: Record<string, string> = {
            eagle: "As a visionary Eagle, ",
            squirrel: "For a careful Squirrel Saver like you, ",
            butterfly: "To support your Butterfly lifestyle, ",
            lion: "To achieve your Lion-sized goals, ",
            capybara: "For a balanced Capybara approach, ",
            fox: "Strategically speaking, "
        };

        const prefix = spiritAnimal ? prefixes[spiritAnimal] || "" : "";

        // Diversification questions
        if (lowerQ.includes('diversif')) {
            const types = new Set(context.selectedFunds.map(f => f.type));
            if (types.size < 2) {
                return `${prefix}your portfolio needs better diversification. I recommend spreading investments across equity, debt, and gold funds. This reduces risk while maintaining growth potential. Would you like me to suggest a balanced mix?`;
            }
            return `${prefix}your portfolio is diversified across ${types.size} asset types. This is good for risk management. Consider maintaining this balance as you add more funds.`;
        }

        // Timing questions
        if (lowerQ.includes('good time') || lowerQ.includes('when to invest')) {
            if (spiritAnimal === 'eagle') {
                return "The best time is always now! Eagles look at the long horizon. Market dips are just opportunities to buy more units at lower prices.";
            } else if (spiritAnimal === 'squirrel') {
                return "Start small and steady. You don't need to time the market - just be consistent with your SIPs to build that safety net safely.";
            }
            return "The best time to invest is now! With SIP (Systematic Investment Plan), you invest regularly regardless of market conditions. This averages out market volatility and builds wealth over time.";
        }

        // Risk questions
        if (lowerQ.includes('risk') || lowerQ.includes('safe')) {
            if (context.riskLevel === 'conservative') {
                return `${prefix}focus on debt and liquid funds with some hybrid funds. These offer stable returns with lower volatility. Avoid pure equity or small-cap funds.`;
            } else if (context.riskLevel === 'aggressive') {
                return `${prefix}your profile allows for higher equity exposure. Consider large-cap and mid-cap equity funds for growth. Balance with some debt funds for stability.`;
            }
            return `${prefix}your moderate risk profile suggests a balanced mix of equity and debt funds. Aim for 60% equity and 40% debt for optimal growth with manageable risk.`;
        }

        // Returns questions
        if (lowerQ.includes('return') || lowerQ.includes('profit')) {
            return "Expected returns vary by fund type: Equity funds (12-15% annually), Hybrid funds (9-12%), Debt funds (6-8%), and Gold (7-9%). Remember, higher returns come with higher risk. Invest for at least 5 years for equity funds.";
        }

        // SIP questions
        if (lowerQ.includes('sip') || lowerQ.includes('how much')) {
            return `${prefix}I recommend starting with ₹${this.userProfile.monthlyInvestmentCapacity.toLocaleString('en-IN')}/month split across 2-3 funds. You can increase this amount as your income grows. Even ₹500/month can create significant wealth over 10+ years!`;
        }

        // Fund suggestion questions
        if (lowerQ.includes('suggest') || lowerQ.includes('recommend') || lowerQ.includes('what to buy') || lowerQ.includes('invest in') || lowerQ.includes('funds')) {
            try {
                const dynamicFunds = await FundSearchService.getDynamicRecommendations(context.riskLevel, context.spiritAnimal);

                if (dynamicFunds.length > 0) {
                    const fundList = dynamicFunds.slice(0, 5).map(f => `• ${f.name}`).join('\n');
                    return `${prefix}based on your ${context.riskLevel} profile${context.spiritAnimal ? ` and ${context.spiritAnimal} traits` : ''}, I've found these relevant funds in the market:\n\n${fundList}\n\nThese align with your strategy. Would you like to analyze any specific one?`;
                }
            } catch (e) {
                console.error("Error fetching dynamic funds", e);
            }
            // Fallback if search fails or returns empty
            return `${prefix}for your ${context.riskLevel} profile, I recommend looking into ${context.riskLevel === 'aggressive' ? 'Small Cap and Mid Cap' : context.riskLevel === 'conservative' ? 'Liquid and Debt' : 'Large Cap and Flexi Cap'} funds. Check the "Top Picks" section for my curated recommendations.`;
        }

        // Default response
        return `${prefix}I'm here to help with your investment decisions! You can ask me about diversification, risk management, SIP amounts, fund selection, or market timing. What specific aspect would you like to know more about?`;
    }

    /**
     * Learn from user's investment decisions
     */
    learnFromDecision(fundId: string, action: 'selected' | 'rejected', sipAmount?: number): void {
        if (action === 'selected') {
            const count = this.learningData.fundSelections.get(fundId) || 0;
            this.learningData.fundSelections.set(fundId, count + 1);

            if (sipAmount) {
                // Update average SIP amount
                const currentAvg = this.learningData.averageSipAmount;
                this.learningData.averageSipAmount = (currentAvg + sipAmount) / 2;
            }
        } else {
            const count = this.learningData.rejections.get(fundId) || 0;
            this.learningData.rejections.set(fundId, count + 1);
        }
    }

    /**
     * Calculate optimal SIP amount for a fund
     */
    private calculateOptimalSip(fund: InvestmentFund, monthlyCapacity: number): number {
        // Base suggestion on fund type and user capacity
        let suggestion = fund.minInvestment;

        if (fund.type === 'equity' || fund.type === 'sip') {
            suggestion = Math.max(fund.minInvestment, monthlyCapacity * 0.4);
        } else if (fund.type === 'hybrid') {
            suggestion = Math.max(fund.minInvestment, monthlyCapacity * 0.3);
        } else if (fund.type === 'debt' || fund.type === 'liquid') {
            suggestion = Math.max(fund.minInvestment, monthlyCapacity * 0.2);
        } else if (fund.type === 'gold') {
            suggestion = Math.max(fund.minInvestment, monthlyCapacity * 0.1);
        }

        // Round to nearest 500
        return Math.round(suggestion / 500) * 500;
    }

    /**
     * Update user profile
     */
    updateProfile(updates: Partial<UserInvestmentProfile>): void {
        this.userProfile = { ...this.userProfile, ...updates };
    }

    /**
     * Get current user profile
     */
    getProfile(): UserInvestmentProfile {
        return { ...this.userProfile };
    }
}
