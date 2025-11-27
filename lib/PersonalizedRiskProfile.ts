import { RiskLevel } from '../app/(tabs)/RiskProfile';
import { SpiritAnimalType } from '../types/spiritAnimal';

export interface UserFinancialProfile {
    age: number;
    dependents: number;
    monthlyIncome: number;
    monthlyEMI: number;
    emergencyFund: number;
    spiritAnimal?: SpiritAnimalType;
}

export interface RiskScore {
    score: number; // 0-100
    category: RiskLevel; // 'conservative' | 'moderate' | 'aggressive'
    baseScore: number;
    adjustments: RiskAdjustment[];
    reasoning: string[];
}

export interface RiskAdjustment {
    factor: string;
    impact: number; // positive or negative adjustment
    reason: string;
}

export class PersonalizedRiskProfile {
    /**
     * Get base risk score from spirit animal
     */
    private static getSpiritAnimalBaseScore(spiritAnimal?: SpiritAnimalType): number {
        const baseScores: Record<SpiritAnimalType, number> = {
            eagle: 80,      // Visionary, high growth
            squirrel: 20,   // Conservative, safety-focused
            butterfly: 70,  // YOLO, experience-driven
            lion: 60,       // Goal-oriented, calculated
            capybara: 50,   // Balanced approach
            fox: 45         // Strategic, value-focused
        };

        return spiritAnimal ? baseScores[spiritAnimal] : 50; // Default to moderate
    }

    /**
     * Calculate personalized risk score based on comprehensive profile
     */
    static calculatePersonalizedRisk(profile: UserFinancialProfile): RiskScore {
        const baseScore = this.getSpiritAnimalBaseScore(profile.spiritAnimal);
        const adjustments: RiskAdjustment[] = [];
        let totalAdjustment = 0;

        // 1. Dependents Adjustment (Heavy Weight)
        // Each dependent reduces risk capacity significantly
        if (profile.dependents > 0) {
            const dependentImpact = profile.dependents * -15;
            totalAdjustment += dependentImpact;
            adjustments.push({
                factor: 'Dependents',
                impact: dependentImpact,
                reason: `${profile.dependents} dependent${profile.dependents > 1 ? 's' : ''} require financial stability`
            });
        } else {
            // No dependents = can take more risk
            totalAdjustment += 10;
            adjustments.push({
                factor: 'Dependents',
                impact: 10,
                reason: 'No dependents allows for higher risk tolerance'
            });
        }

        // 2. Age Adjustment
        if (profile.age < 30) {
            totalAdjustment += 15;
            adjustments.push({
                factor: 'Age',
                impact: 15,
                reason: 'Young age provides longer investment horizon'
            });
        } else if (profile.age >= 30 && profile.age < 45) {
            totalAdjustment += 5;
            adjustments.push({
                factor: 'Age',
                impact: 5,
                reason: 'Prime earning years with good risk capacity'
            });
        } else if (profile.age >= 45 && profile.age < 55) {
            totalAdjustment -= 10;
            adjustments.push({
                factor: 'Age',
                impact: -10,
                reason: 'Approaching retirement, need more stability'
            });
        } else {
            totalAdjustment -= 25;
            adjustments.push({
                factor: 'Age',
                impact: -25,
                reason: 'Near/in retirement, capital preservation crucial'
            });
        }

        // 3. EMI-to-Income Ratio Adjustment
        const emiRatio = profile.monthlyEMI / profile.monthlyIncome;
        if (emiRatio > 0.5) {
            totalAdjustment -= 30;
            adjustments.push({
                factor: 'Debt Burden',
                impact: -30,
                reason: `High EMI burden (${(emiRatio * 100).toFixed(0)}% of income)`
            });
        } else if (emiRatio > 0.3) {
            totalAdjustment -= 15;
            adjustments.push({
                factor: 'Debt Burden',
                impact: -15,
                reason: `Moderate EMI burden (${(emiRatio * 100).toFixed(0)}% of income)`
            });
        } else if (emiRatio > 0) {
            totalAdjustment -= 5;
            adjustments.push({
                factor: 'Debt Burden',
                impact: -5,
                reason: `Low EMI burden (${(emiRatio * 100).toFixed(0)}% of income)`
            });
        }

        // 4. Emergency Fund Adjustment
        const emergencyFundMonths = profile.emergencyFund / profile.monthlyIncome;
        if (emergencyFundMonths >= 6) {
            totalAdjustment += 15;
            adjustments.push({
                factor: 'Emergency Fund',
                impact: 15,
                reason: `Strong safety net (${emergencyFundMonths.toFixed(1)} months)`
            });
        } else if (emergencyFundMonths >= 3) {
            totalAdjustment += 5;
            adjustments.push({
                factor: 'Emergency Fund',
                impact: 5,
                reason: `Adequate safety net (${emergencyFundMonths.toFixed(1)} months)`
            });
        } else {
            totalAdjustment -= 20;
            adjustments.push({
                factor: 'Emergency Fund',
                impact: -20,
                reason: `Insufficient safety net (${emergencyFundMonths.toFixed(1)} months)`
            });
        }

        // 5. Income Level Adjustment (capacity to absorb losses)
        if (profile.monthlyIncome > 150000) {
            totalAdjustment += 10;
            adjustments.push({
                factor: 'Income Level',
                impact: 10,
                reason: 'High income provides buffer for market volatility'
            });
        } else if (profile.monthlyIncome < 30000) {
            totalAdjustment -= 10;
            adjustments.push({
                factor: 'Income Level',
                impact: -10,
                reason: 'Limited income requires capital preservation'
            });
        }

        // Calculate final score (clamped between 0-100)
        const finalScore = Math.max(0, Math.min(100, baseScore + totalAdjustment));

        // Categorize risk level
        let category: RiskLevel;
        if (finalScore <= 33) {
            category = 'conservative';
        } else if (finalScore <= 66) {
            category = 'moderate';
        } else {
            category = 'aggressive';
        }

        // Generate reasoning
        const reasoning = this.generateReasoning(profile, baseScore, finalScore, adjustments);

        return {
            score: finalScore,
            category,
            baseScore,
            adjustments,
            reasoning
        };
    }

    /**
     * Generate human-readable reasoning for risk adjustments
     */
    private static generateReasoning(
        profile: UserFinancialProfile,
        baseScore: number,
        finalScore: number,
        adjustments: RiskAdjustment[]
    ): string[] {
        const reasoning: string[] = [];
        const adjustment = finalScore - baseScore;

        // Opening statement
        if (profile.spiritAnimal) {
            const animalName = this.getSpiritAnimalName(profile.spiritAnimal);
            reasoning.push(`As a ${animalName}, your base risk tolerance is ${this.getRiskDescription(baseScore)}.`);
        }

        // Explain significant adjustments
        if (Math.abs(adjustment) > 10) {
            if (adjustment < 0) {
                reasoning.push(`We've adjusted your recommendations to be more conservative because:`);
            } else {
                reasoning.push(`We've adjusted your recommendations to be more aggressive because:`);
            }

            // List major adjustments
            adjustments
                .filter(adj => Math.abs(adj.impact) >= 10)
                .forEach(adj => {
                    reasoning.push(`• ${adj.reason}`);
                });
        } else {
            reasoning.push('Your profile aligns well with your natural risk preference.');
        }

        // Final recommendation
        reasoning.push(`Your personalized risk level: ${this.getRiskDescription(finalScore)}`);

        return reasoning;
    }

    private static getSpiritAnimalName(animal: SpiritAnimalType): string {
        const names: Record<SpiritAnimalType, string> = {
            eagle: 'Eagle Investor',
            squirrel: 'Squirrel Saver',
            butterfly: 'Butterfly Spender',
            lion: 'Lion Achiever',
            capybara: 'Capybara Balancer',
            fox: 'Fox Optimizer'
        };
        return names[animal];
    }

    private static getRiskDescription(score: number): string {
        if (score <= 33) return 'Conservative (Capital Preservation)';
        if (score <= 66) return 'Moderate (Balanced Growth)';
        return 'Aggressive (High Growth)';
    }

    /**
     * Get recommended asset allocation based on risk score
     */
    static getAssetAllocation(riskScore: number): {
        equity: number;
        debt: number;
        gold: number;
        liquid: number;
    } {
        if (riskScore <= 33) {
            // Conservative
            return { equity: 20, debt: 50, gold: 10, liquid: 20 };
        } else if (riskScore <= 66) {
            // Moderate
            return { equity: 50, debt: 30, gold: 10, liquid: 10 };
        } else {
            // Aggressive
            return { equity: 70, debt: 15, gold: 10, liquid: 5 };
        }
    }
}
