/**
 * Insurance Recommendation Engine
 * Analyzes user's financial situation and provides personalized insurance recommendations
 */

import { SpiritAnimalType } from '../types/spiritAnimal';
import { InsuranceDataService } from './InsuranceDataService';

export interface InsuranceRecommendation {
    type: 'health' | 'term-life' | 'critical-illness' | 'accident';
    priority: 'critical' | 'high' | 'medium' | 'low';
    suggestedCoverage: number;
    monthlyPremium: number;
    reasoning: string[];
    benefits: string[];
    providers: string[];
    savingsPotential: number; // How much you save vs paying out-of-pocket
    coverageGap?: number; // If user has existing coverage
}

export interface UserInsuranceProfile {
    age: number;
    monthlyIncome: number;
    dependents: number;
    hasExistingHealth: boolean;
    hasExistingLife: boolean;
    existingHealthCoverage?: number;
    existingLifeCoverage?: number;
    monthlyEMI: number;
    emergencyFund: number;
    spiritAnimal?: SpiritAnimalType;
}

/**
 * Calculate recommended health insurance coverage
 */
function calculateHealthCoverage(profile: UserInsuranceProfile): number {
    // Base coverage: 10x monthly income or minimum 5 lakhs
    let coverage = Math.max(500000, profile.monthlyIncome * 10);

    // Increase for dependents
    coverage += profile.dependents * 200000;

    // Round to nearest lakh
    return Math.round(coverage / 100000) * 100000;
}

/**
 * Calculate recommended term life insurance coverage
 */
function calculateLifeCoverage(profile: UserInsuranceProfile): number {
    // Human Life Value method: 15-20 years of annual income
    const annualIncome = profile.monthlyIncome * 12;
    let coverage = annualIncome * 15;

    // Add outstanding liabilities (EMIs for next 10 years)
    coverage += profile.monthlyEMI * 12 * 10;

    // Add education/marriage corpus for dependents
    coverage += profile.dependents * 1000000;

    // Round to nearest 10 lakhs
    return Math.round(coverage / 1000000) * 1000000;
}

/**
 * Estimate monthly premium for health insurance
 */
function estimateHealthPremium(coverage: number, age: number, dependents: number): number {
    // Base premium per lakh of coverage
    let premiumPerLakh = 80;

    // Age factor
    if (age > 45) premiumPerLakh *= 2;
    else if (age > 35) premiumPerLakh *= 1.5;
    else if (age > 25) premiumPerLakh *= 1.2;

    // Family floater discount
    if (dependents > 0) {
        premiumPerLakh *= 0.8; // 20% discount for family floater
    }

    const annualPremium = (coverage / 100000) * premiumPerLakh;
    return Math.round(annualPremium / 12);
}

/**
 * Estimate monthly premium for term life insurance
 */
function estimateLifePremium(coverage: number, age: number): number {
    // Premium per lakh of coverage (very affordable for term insurance)
    let premiumPerLakh = 30;

    // Age factor
    if (age > 45) premiumPerLakh *= 3;
    else if (age > 35) premiumPerLakh *= 2;
    else if (age > 25) premiumPerLakh *= 1.5;

    const annualPremium = (coverage / 100000) * premiumPerLakh;
    return Math.round(annualPremium / 12);
}

/**
 * Generate personalized insurance recommendations
 */
export function generateInsuranceRecommendations(
    profile: UserInsuranceProfile
): InsuranceRecommendation[] {
    const recommendations: InsuranceRecommendation[] = [];

    // 1. Health Insurance - Always Critical
    const realPlans = InsuranceDataService.getRecommendations(profile.age, profile.monthlyIncome, profile.spiritAnimal);
    const healthPlan = realPlans.find(p => p.type === 'health');

    if (healthPlan) {
        const healthCoverageGap = profile.hasExistingHealth
            ? Math.max(0, healthPlan.coverAmount - (profile.existingHealthCoverage || 0))
            : healthPlan.coverAmount;

        recommendations.push({
            type: 'health',
            priority: 'critical',
            suggestedCoverage: healthPlan.coverAmount,
            monthlyPremium: healthPlan.premiumPerMonth,
            reasoning: [
                `Recommended Plan: ${healthPlan.provider} ${healthPlan.name}`,
                `Coverage: ₹${(healthPlan.coverAmount / 100000).toFixed(0)} Lakhs`,
                ...healthPlan.features,
                'Cashless treatment at network hospitals'
            ],
            benefits: [
                ...healthPlan.features,
                'Tax benefits under Section 80D'
            ],
            providers: [healthPlan.provider],
            savingsPotential: healthPlan.coverAmount * 0.6,
            coverageGap: healthCoverageGap
        });
    }

    // 2. Term Life Insurance - Critical if dependents exist
    const termPlan = realPlans.find(p => p.type === 'term-life');
    if (termPlan && (profile.dependents > 0 || profile.monthlyEMI > 0)) {
        const lifeCoverageGap = profile.hasExistingLife
            ? Math.max(0, termPlan.coverAmount - (profile.existingLifeCoverage || 0))
            : termPlan.coverAmount;

        recommendations.push({
            type: 'term-life',
            priority: profile.dependents > 0 ? 'critical' : 'high',
            suggestedCoverage: termPlan.coverAmount,
            monthlyPremium: termPlan.premiumPerMonth,
            reasoning: [
                `Recommended Plan: ${termPlan.provider} ${termPlan.name}`,
                `Coverage: ₹${(termPlan.coverAmount / 10000000).toFixed(2)} Crore`,
                ...termPlan.features,
                profile.monthlyEMI > 0 ? 'Covers outstanding loan liabilities' : 'Ensures family financial security'
            ],
            benefits: [
                ...termPlan.features,
                'Tax benefits under Section 80C',
                'Lump sum payout to nominees'
            ],
            providers: [termPlan.provider],
            savingsPotential: termPlan.coverAmount,
            coverageGap: lifeCoverageGap
        });
    }

    // 3. Critical Illness - High priority for family builders
    if (profile.age > 30 || profile.dependents > 0) {
        const ciCoverage = Math.min(2500000, profile.monthlyIncome * 30);
        const ciPremium = Math.round(ciCoverage / 100000 * 50 / 12); // ₹50 per lakh per month

        recommendations.push({
            type: 'critical-illness',
            priority: profile.dependents > 0 ? 'high' : 'medium',
            suggestedCoverage: ciCoverage,
            monthlyPremium: ciPremium,
            reasoning: [
                'Covers 36+ critical illnesses (cancer, heart attack, stroke)',
                `Lump sum of ₹${(ciCoverage / 100000).toFixed(0)} lakhs on diagnosis`,
                'Use money for treatment, recovery, or income replacement',
                'Independent of health insurance - additional protection'
            ],
            benefits: [
                'Lump sum payout on diagnosis',
                'No restrictions on money usage',
                'Covers treatment costs abroad',
                'Income replacement during recovery',
                'Premium waiver on claim'
            ],
            providers: ['Max Bupa', 'Star Health', 'HDFC Ergo', 'ICICI Lombard'],
            savingsPotential: ciCoverage * 0.8, // 80% of coverage for treatment
        });
    }

    // 4. Personal Accident - Medium priority
    const accidentCoverage = Math.min(5000000, profile.monthlyIncome * 50);
    const accidentPremium = Math.round(accidentCoverage / 100000 * 20 / 12); // ₹20 per lakh per month

    recommendations.push({
        type: 'accident',
        priority: 'medium',
        suggestedCoverage: accidentCoverage,
        monthlyPremium: accidentPremium,
        reasoning: [
            'Covers accidental death and disability',
            `Coverage: ₹${(accidentCoverage / 100000).toFixed(0)} lakhs`,
            'Very affordable premiums',
            'Complements term life insurance'
        ],
        benefits: [
            'Accidental death benefit',
            'Permanent disability coverage',
            'Temporary disability benefits',
            'Medical expenses for accidents',
            'Extremely low premiums'
        ],
        providers: ['HDFC Ergo', 'ICICI Lombard', 'Bajaj Allianz', 'Tata AIG'],
        savingsPotential: accidentCoverage * 0.5,
    });

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
}

/**
 * Calculate total monthly insurance budget
 */
export function calculateInsuranceBudget(monthlyIncome: number, spiritAnimal?: SpiritAnimalType): number {
    // General rule: 10-15% of income for insurance
    let percentage = 0.12; // 12% default

    // Adjust based on personality
    if (spiritAnimal === 'squirrel') {
        percentage = 0.15; // Squirrels value security more
    } else if (spiritAnimal === 'butterfly') {
        percentage = 0.08; // Butterflies prefer lower commitment
    } else if (spiritAnimal === 'eagle' || spiritAnimal === 'lion') {
        percentage = 0.10; // Goal-focused, balanced approach
    }

    return Math.round(monthlyIncome * percentage);
}

/**
 * Get personality-specific insurance advice
 */
export function getPersonalityInsuranceAdvice(spiritAnimal: SpiritAnimalType): string {
    const advice: Record<SpiritAnimalType, string> = {
        eagle: 'As an Eagle, you understand that insurance protects your wealth-building journey. Secure your foundation before taking flight.',
        squirrel: 'Perfect for you! Insurance is the ultimate safety net. Protect what you\'ve carefully saved.',
        butterfly: 'Think of insurance as freedom insurance - it lets you enjoy life without worry about what-ifs.',
        lion: 'Insurance aligns with your goals. It ensures nothing derails your carefully planned financial milestones.',
        capybara: 'Insurance provides the balance you seek - enjoy life today while protecting tomorrow.',
        fox: 'Smart move! Insurance is the most cost-effective risk management strategy. Maximum protection, minimal cost.'
    };

    return advice[spiritAnimal];
}
