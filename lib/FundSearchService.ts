import { RiskLevel } from '../app/(tabs)/RiskProfile';
import { SpiritAnimalType } from '../types/spiritAnimal';

export interface MFAPIScheme {
    schemeCode: number;
    schemeName: string;
}

export interface FundSearchResult {
    code: string;
    name: string;
    category?: string;
}

export class FundSearchService {
    private static BASE_URL = 'https://api.mfapi.in/mf';

    /**
     * Infer fund type from name
     */
    static inferFundType(name: string): 'equity' | 'debt' | 'hybrid' | 'gold' | 'liquid' {
        const n = name.toLowerCase();
        if (n.includes('liquid') || n.includes('overnight')) return 'liquid';
        if (n.includes('gold')) return 'gold';
        if (n.includes('debt') || n.includes('bond') || n.includes('gilt')) return 'debt';
        if (n.includes('hybrid') || n.includes('balanced') || n.includes('advantage')) return 'hybrid';
        return 'equity'; // Default to Equity
    }

    /**
     * Infer risk level from name
     */
    static inferRiskLevel(name: string): 'low' | 'medium' | 'high' {
        const n = name.toLowerCase();
        if (n.includes('liquid') || n.includes('overnight') || n.includes('gilt')) return 'low';
        if (n.includes('hybrid') || n.includes('balanced') || n.includes('large cap') || n.includes('bluechip')) return 'medium';
        if (n.includes('small cap') || n.includes('mid cap') || n.includes('flexi') || n.includes('focus')) return 'high';
        return 'high'; // Default to high for equity
    }

    /**
     * Search for mutual funds using a query string
     */
    static async searchFunds(query: string): Promise<FundSearchResult[]> {
        try {
            const response = await fetch(`${this.BASE_URL}/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) return [];

            const data: MFAPIScheme[] = await response.json();

            // Map to our format and limit results
            return data.slice(0, 5).map(scheme => ({
                code: scheme.schemeCode.toString(),
                name: scheme.schemeName,
                // We don't get category from search, so we'll infer or leave undefined
            }));
        } catch (error) {
            console.error('Error searching funds:', error);
            return [];
        }
    }

    /**
     * Generate search queries based on user profile
     */
    static getQueriesForProfile(riskLevel: RiskLevel, spiritAnimal?: SpiritAnimalType): string[] {
        const queries: string[] = [];

        // 1. Risk-based base queries
        switch (riskLevel) {
            case 'conservative':
                queries.push('Liquid', 'Overnight', 'Debt');
                break;
            case 'moderate':
                queries.push('Balanced', 'Hybrid', 'Large Cap');
                break;
            case 'aggressive':
                queries.push('Small Cap', 'Mid Cap', 'Growth');
                break;
        }

        // 2. Personality-based modifiers (if available)
        if (spiritAnimal) {
            switch (spiritAnimal) {
                case 'eagle': // Visionary, high growth
                    if (riskLevel === 'aggressive') queries.push('Technology', 'Innovation');
                    else queries.push('Flexi Cap');
                    break;
                case 'squirrel': // Saver, safe
                    queries.push('Savings', 'Conservative');
                    break;
                case 'fox': // Strategic, optimization
                    queries.push('Index', 'Advantage');
                    break;
                case 'lion': // Leader, bold
                    queries.push('Bluechip', 'Top 100');
                    break;
                case 'capybara': // Balancer
                    queries.push('Balanced', 'Hybrid');
                    break;
                case 'butterfly': // Spender/YOLO -> High growth/Thematic
                    queries.push('Consumption', 'Thematic');
                    break;
            }
        }

        return [...new Set(queries)]; // Remove duplicates
    }

    /**
     * Get a mix of funds for the user
     */
    static async getDynamicRecommendations(riskLevel: RiskLevel, spiritAnimal?: SpiritAnimalType): Promise<FundSearchResult[]> {
        const queries = this.getQueriesForProfile(riskLevel, spiritAnimal);

        // Execute searches in parallel
        const searchPromises = queries.map(q => this.searchFunds(q));
        const results = await Promise.all(searchPromises);

        let allResults: FundSearchResult[] = [];
        const seenCodes = new Set<string>();

        // 1. Strict Filter: Direct & Growth (Case Insensitive)
        results.flat().forEach(fund => {
            if (!seenCodes.has(fund.code)) {
                const nameUpper = fund.name.toUpperCase();
                if (nameUpper.includes('DIRECT') && nameUpper.includes('GROWTH')) {
                    seenCodes.add(fund.code);
                    allResults.push(fund);
                }
            }
        });

        // 2. Relaxed Filter: Just Growth (if we need more)
        if (allResults.length < 5) {
            results.flat().forEach(fund => {
                if (!seenCodes.has(fund.code)) {
                    const nameUpper = fund.name.toUpperCase();
                    if (nameUpper.includes('GROWTH')) {
                        seenCodes.add(fund.code);
                        allResults.push(fund);
                    }
                }
            });
        }

        // 3. Fallback: Anything found (if still need more)
        if (allResults.length < 3) {
            results.flat().forEach(fund => {
                if (!seenCodes.has(fund.code)) {
                    seenCodes.add(fund.code);
                    allResults.push(fund);
                }
            });
        }

        return allResults.slice(0, 10); // Return top 10 unique funds
    }
}
