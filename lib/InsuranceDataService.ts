import { SpiritAnimalType } from '../types/spiritAnimal';

export interface InsurancePlan {
    id: string;
    provider: string;
    name: string;
    type: 'health' | 'term-life';
    coverAmount: number; // in Rupees
    premiumPerYear: number;
    premiumPerMonth: number;
    features: string[];
    minAge: number;
    maxAge: number;
    link: string;
}

export const REAL_INSURANCE_PLANS: InsurancePlan[] = [
    // Health Insurance
    {
        id: 'niva-bupa-reassure',
        provider: 'Niva Bupa',
        name: 'ReAssure 2.0',
        type: 'health',
        coverAmount: 1000000,
        premiumPerYear: 6500,
        premiumPerMonth: 541,
        features: ['Unlimited restoration of cover', 'Age-lock feature', 'No claim bonus'],
        minAge: 18,
        maxAge: 65,
        link: 'https://www.nivabupa.com/'
    },
    {
        id: 'hdfc-ergo-optima',
        provider: 'HDFC ERGO',
        name: 'Optima Secure',
        type: 'health',
        coverAmount: 1000000,
        premiumPerYear: 26700,
        premiumPerMonth: 2225,
        features: ['4X coverage benefit', 'No claim bonus', 'Cashless treatment'],
        minAge: 18,
        maxAge: 65,
        link: 'https://www.hdfcergo.com/'
    },
    {
        id: 'star-health-comprehensive',
        provider: 'Star Health',
        name: 'Comprehensive Policy',
        type: 'health',
        coverAmount: 500000,
        premiumPerYear: 4800,
        premiumPerMonth: 400,
        features: ['No capping on room rent', 'Free health check-up', 'Maternity cover'],
        minAge: 18,
        maxAge: 65,
        link: 'https://www.starhealth.in/'
    },
    // Term Life Insurance
    {
        id: 'icici-iprotect',
        provider: 'ICICI Prudential',
        name: 'iProtect Smart',
        type: 'term-life',
        coverAmount: 10000000,
        premiumPerYear: 9512,
        premiumPerMonth: 792,
        features: ['Critical illness cover', 'Accidental death benefit', 'Terminal illness benefit'],
        minAge: 18,
        maxAge: 60,
        link: 'https://www.iciciprulife.com/'
    },
    {
        id: 'max-life-smart-secure',
        provider: 'Max Life',
        name: 'Smart Secure Plus',
        type: 'term-life',
        coverAmount: 10000000,
        premiumPerYear: 10578,
        premiumPerMonth: 881,
        features: ['Return of premium option', 'Joint life cover', 'Premium break option'],
        minAge: 18,
        maxAge: 60,
        link: 'https://www.maxlifeinsurance.com/'
    },
    {
        id: 'hdfc-life-click2protect',
        provider: 'HDFC Life',
        name: 'Click2Protect Super',
        type: 'term-life',
        coverAmount: 10000000,
        premiumPerYear: 20033,
        premiumPerMonth: 1669,
        features: ['Return of premium', 'Accelerated death benefit', 'Waiver of premium on disability'],
        minAge: 18,
        maxAge: 65,
        link: 'https://www.hdfclife.com/'
    }
];

export class InsuranceDataService {
    static getRecommendations(age: number, monthlyIncome: number, spiritAnimal?: SpiritAnimalType): InsurancePlan[] {
        const recommendations: InsurancePlan[] = [];

        // Health Logic
        // High income -> Premium plan
        if (monthlyIncome > 100000) {
            recommendations.push(REAL_INSURANCE_PLANS.find(p => p.id === 'hdfc-ergo-optima')!);
        } else if (monthlyIncome > 50000) {
            recommendations.push(REAL_INSURANCE_PLANS.find(p => p.id === 'niva-bupa-reassure')!);
        } else {
            recommendations.push(REAL_INSURANCE_PLANS.find(p => p.id === 'star-health-comprehensive')!);
        }

        // Term Logic
        // If dependents or high income, suggest term
        // For simplicity, always suggest one term plan
        if (monthlyIncome > 80000) {
            recommendations.push(REAL_INSURANCE_PLANS.find(p => p.id === 'hdfc-life-click2protect')!);
        } else {
            recommendations.push(REAL_INSURANCE_PLANS.find(p => p.id === 'icici-iprotect')!);
        }

        return recommendations;
    }
}
