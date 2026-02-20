import { GoogleGenAI } from "@google/genai";
import {
    AIInsights,
    Anomaly,
    BudgetRebalanceSuggestion,
    CategoryAnalysis,
    CoachingAdvice,
    FinancialContext,
    PersonalizedRule,
    Prediction,
    SpendingPattern,
    SpendingReduction,
    Transaction
} from '../types/aiInsights';
import { AICache } from '../utils/aiCache';

const GEMINI_API_KEY = 'AIzaSyCZi8_h_P8aa5r1Vl9PCJEMOsRIRZrdUTU';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * AI Financial Analyzer
 * Implements all 8 steps of intelligent financial analysis
 */
export class AIFinancialAnalyzer {

    /**
     * Main analysis function - orchestrates all AI insights
     */
    static async analyzeFinances(
        context: FinancialContext,
        forceRefresh: boolean = false
    ): Promise<AIInsights> {
        try {
            // Check cache first
            if (!forceRefresh) {
                const cached = await AICache.get(context.userId);
                if (cached) {
                    console.log('Using cached AI insights');
                    return cached;
                }
            }

            // Run all analysis steps
            const [
                patterns,
                predictions,
                categoryAnalysis,
                anomalies,
                rebalancing,
                reductionSuggestions,
                personalizedRules
            ] = await Promise.all([
                this.detectSpendingPatterns(context),
                this.generatePredictions(context),
                this.analyzeCategoryTrends(context),
                this.detectAnomalies(context),
                this.suggestBudgetRebalancing(context),
                this.generateReductionSuggestions(context),
                this.generatePersonalizedRules(context)
            ]);

            // Generate coaching advice based on all insights
            const coaching = await this.generateCoachingAdvice(context, {
                patterns,
                predictions,
                categoryAnalysis,
                anomalies,
                rebalancing
            });

            const insights: AIInsights = {
                patterns,
                predictions,
                categoryAnalysis,
                coaching,
                rebalancing,
                anomalies,
                reductionSuggestions,
                personalizedRules,
                lastUpdated: new Date().toISOString(),
                confidence: this.calculateOverallConfidence(context)
            };

            // Cache the results
            await AICache.set(context.userId, insights);

            return insights;
        } catch (error) {
            console.error('Error in AI analysis:', error);
            return this.getFallbackInsights();
        }
    }

    /**
     * STEP 1: Detect Spending Patterns
     * Compares current spending to historical averages
     */
    static async detectSpendingPatterns(context: FinancialContext): Promise<SpendingPattern[]> {
        try {
            const { transactions, userId } = context;

            // Calculate patterns for each category
            const categoryPatterns = this.calculateCategoryPatterns(transactions, userId);

            // Calculate advanced patterns (Day of Week, Daily Averages, Income)
            const advancedPatterns = this.calculateAdvancedPatterns(context);

            const allPatterns = [...categoryPatterns, ...advancedPatterns];

            // Use AI to generate insights
            if (!GEMINI_API_KEY) {
                return this.generateRuleBasedPatterns(allPatterns);
            }

            const prompt = `Analyze these spending patterns and generate insights:

${JSON.stringify(allPatterns, null, 2)}

For each category, provide:
1. A trend analysis (rising/stable/falling)
2. A specific insight comparing to historical averages
3. Use exact percentages

Output JSON array of patterns with: category, trend, insight`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: 'application/json',
                    temperature: 0.3,
                    maxOutputTokens: 1000
                }
            });

            const aiPatterns = this.safeJsonParse(response.text || '[]', []);

            // Merge AI insights with calculated data
            return allPatterns.map((pattern, index) => ({
                ...pattern,
                trend: aiPatterns[index]?.trend || pattern.trend,
                insight: aiPatterns[index]?.insight || pattern.insight
            }));

        } catch (error) {
            console.error('Error detecting patterns:', error);
            return [];
        }
    }

    /**
     * STEP 2: Generate Predictions
     * Predicts future spending and financial outcomes
     */
    static async generatePredictions(context: FinancialContext): Promise<Prediction[]> {
        try {
            if (!GEMINI_API_KEY) {
                return this.generateRuleBasedPredictions(context);
            }

            const prompt = `You are a financial prediction AI. Analyze this user's data and make predictions:

Income: ₹${context.totalIncome}
Spent: ₹${context.totalSpent}
Savings Rate: ${context.savingsRate}%
Income Type: ${context.isGigWorker ? 'Gig Worker' : 'Salaried'}
Spending Pattern: ${context.spendingPattern}
Transaction Count: ${context.transactionCount}
Time Range: ${context.timeRange}

Top Categories:
${context.topCategories.map(c => `- ${c.category}: ₹${c.amount} (${c.percentage}%)`).join('\n')}

Generate 3-5 predictions about:
1. Will they overspend this week/month?
2. Will they hit savings targets?
3. Will any category cross limits?
4. When will money finish at current pace?

Output JSON array with: type, title, message, severity, daysUntil (optional), amount (optional), confidence (0-100)`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: 'application/json',
                    temperature: 0.5,
                    maxOutputTokens: 1500
                }
            });

            return this.safeJsonParse(response.text || '[]', []);

        } catch (error) {
            console.error('Error generating predictions:', error);
            return this.generateRuleBasedPredictions(context);
        }
    }

    /**
     * STEP 3: Analyze Category Trends
     * Identifies which categories are rising, stable, or reducible
     */
    static async analyzeCategoryTrends(context: FinancialContext): Promise<CategoryAnalysis[]> {
        try {
            const categoryData = this.calculateCategoryTrends(context.transactions, context.userId);

            if (!GEMINI_API_KEY) {
                return categoryData.map(cat => ({
                    ...cat,
                    recommendation: this.getGenericRecommendation(cat.status)
                }));
            }

            const prompt = `Analyze these category trends and provide specific recommendations:

${JSON.stringify(categoryData, null, 2)}

For each category, provide a specific, actionable recommendation based on its status.
Output JSON array with: category, status, recommendation, priority`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: 'application/json',
                    temperature: 0.4,
                    maxOutputTokens: 1000
                }
            });

            const aiRecommendations = this.safeJsonParse(response.text || '[]', []);

            return categoryData.map((cat, index) => ({
                ...cat,
                recommendation: aiRecommendations[index]?.recommendation || cat.recommendation,
                priority: aiRecommendations[index]?.priority || cat.priority
            }));

        } catch (error) {
            console.error('Error analyzing categories:', error);
            return [];
        }
    }

    /**
     * STEP 4: Generate Personal Coaching
     * Creates actionable, personalized financial advice
     */
    static async generateCoachingAdvice(
        context: FinancialContext,
        insights: {
            patterns: SpendingPattern[];
            predictions: Prediction[];
            categoryAnalysis: CategoryAnalysis[];
            anomalies: Anomaly[];
            rebalancing: BudgetRebalanceSuggestion | null;
        }
    ): Promise<CoachingAdvice[]> {
        try {
            if (!GEMINI_API_KEY) {
                return this.generateRuleBasedCoaching(context, insights);
            }

            const prompt = `You are a personal financial coach. Generate actionable advice based on this data:

User Profile:
- Income: ₹${context.totalIncome}
- Spent: ₹${context.totalSpent}
- Savings: ₹${context.totalSaved} (${context.savingsRate}%)
- Type: ${context.isGigWorker ? 'Gig Worker' : 'Salaried'}
- Pattern: ${context.spendingPattern}

Insights:
- ${insights.patterns.length} spending patterns detected
- ${insights.predictions.length} predictions made
- ${insights.anomalies.length} anomalies found

Generate 3-5 coaching messages that are:
1. Specific and actionable (e.g., "Spend ₹120 less tomorrow")
2. Not generic tips
3. Based on actual behavior
4. Encouraging when appropriate

Output JSON array with: type (tip/warning/action/kudos), title, message, priority, actionLabel (optional)`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: 'application/json',
                    temperature: 0.6,
                    maxOutputTokens: 1500
                }
            });

            return this.safeJsonParse(response.text || '[]', []);

        } catch (error) {
            console.error('Error generating coaching:', error);
            return this.generateRuleBasedCoaching(context, insights);
        }
    }

    /**
     * STEP 5: Suggest Budget Rebalancing
     * Automatically suggests moving money between categories
     */
    static async suggestBudgetRebalancing(context: FinancialContext): Promise<BudgetRebalanceSuggestion | null> {
        try {
            if (!GEMINI_API_KEY) {
                return this.generateRuleBasedRebalancing(context);
            }

            const prompt = `Analyze this budget and suggest rebalancing:

Income: ₹${context.totalIncome}
Spent: ₹${context.totalSpent}
Savings Rate: ${context.savingsRate}%

Top Categories:
${context.topCategories.map(c => `- ${c.category}: ₹${c.amount} (${c.percentage}%)`).join('\n')}

Suggest 2-3 budget rebalancing moves to:
1. Increase savings
2. Decrease wants/non-essentials
3. Balance the budget

Output JSON with: suggestions (array of {fromCategory, toCategory, amount, reason, impact}), totalSavingsIncrease, totalWantsDecrease, message`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: 'application/json',
                    temperature: 0.4,
                    maxOutputTokens: 1000
                }
            });

            const rebalancing = this.safeJsonParse(response.text || 'null', null);

            if (rebalancing && rebalancing.suggestions) {
                // Mark all as not approved initially
                rebalancing.suggestions = rebalancing.suggestions.map((s: any) => ({
                    ...s,
                    approved: false
                }));
            }

            return rebalancing;

        } catch (error) {
            console.error('Error suggesting rebalancing:', error);
            return null;
        }
    }

    /**
     * STEP 6: Detect Anomalies
     * Identifies suspicious or unusual transactions
     */
    static async detectAnomalies(context: FinancialContext): Promise<Anomaly[]> {
        try {
            const anomalies: Anomaly[] = [];
            const { transactions, userId } = context;

            // Calculate normal spending per category
            const categoryAverages = this.calculateCategoryAverages(transactions, userId);

            // Find transactions that deviate significantly
            const userTransactions = transactions.filter(t => t.from_user_id === userId);

            for (const transaction of userTransactions) {
                const category = transaction.transaction_type || 'other';
                const normalAmount = categoryAverages[category] || 0;

                if (normalAmount > 0) {
                    const deviationMultiple = transaction.amount / normalAmount;

                    // Flag if 3x or more than normal
                    if (deviationMultiple >= 3) {
                        anomalies.push({
                            transactionId: transaction.id,
                            amount: transaction.amount,
                            category,
                            date: transaction.created_at,
                            normalAmount,
                            deviationMultiple: Math.round(deviationMultiple),
                            message: `This ${category} expense is ${Math.round(deviationMultiple)}× higher than your usual ${category} spending. Is this expected?`,
                            severity: deviationMultiple >= 8 ? 'high' : deviationMultiple >= 5 ? 'medium' : 'low',
                            confirmed: false,
                            flagged: false
                        });
                    }
                }
            }

            return anomalies.slice(0, 5); // Return top 5 anomalies

        } catch (error) {
            console.error('Error detecting anomalies:', error);
            return [];
        }
    }

    /**
     * STEP 7: Generate Spending Reduction Suggestions
     * Provides specific strategies to reduce spending
     */
    static async generateReductionSuggestions(context: FinancialContext): Promise<SpendingReduction[]> {
        try {
            if (!GEMINI_API_KEY) {
                return this.generateRuleBasedReductions(context);
            }

            const highSpendingCategories = context.topCategories.slice(0, 3);

            const prompt = `Generate spending reduction strategies for these categories:

${highSpendingCategories.map(c => `${c.category}: ₹${c.amount}`).join('\n')}

For each category, provide:
1. Suggested reduction amount (realistic)
2. 3-4 specific strategies (not generic)
3. Potential savings
4. Difficulty level

Examples:
- Food: meal planning, cook at home, reduce takeout
- Transport: carpool, use public transit, plan routes
- Shopping: 30-day rule, unsubscribe emails, no-spend days

Output JSON array with: category, currentSpending, suggestedReduction, strategies (array), potentialSavings, difficulty`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: 'application/json',
                    temperature: 0.5,
                    maxOutputTokens: 1500
                }
            });

            return this.safeJsonParse(response.text || '[]', []);

        } catch (error) {
            console.error('Error generating reduction suggestions:', error);
            return this.generateRuleBasedReductions(context);
        }
    }

    /**
     * STEP 8: Generate Personalized Rules
     * Creates custom rules based on learned patterns
     */
    static async generatePersonalizedRules(context: FinancialContext): Promise<PersonalizedRule[]> {
        try {
            if (!GEMINI_API_KEY) {
                return this.generateRuleBasedRules(context);
            }

            // Analyze patterns to learn from
            const patterns = this.analyzeUserPatterns(context);

            const prompt = `Based on this user's spending patterns, generate 2-3 personalized financial rules:

Patterns Detected:
${patterns.map(p => `- ${p}`).join('\n')}

User Type: ${context.isGigWorker ? 'Gig Worker' : 'Salaried'}
Spending Pattern: ${context.spendingPattern}

Generate rules like:
- "Weekend spending limit: ₹500" (if overspends on weekends)
- "Amazon purchase cooldown: 24 hours" (if frequent Amazon purchases)
- "Daily food budget: ₹200" (if food spending is high)

Output JSON array with: type, title, description, condition, action, learnedFrom`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: 'application/json',
                    temperature: 0.5,
                    maxOutputTokens: 1000
                }
            });

            const rules = this.safeJsonParse(response.text || '[]', []);

            return rules.map((rule: any, index: number) => ({
                ...rule,
                id: `rule_${Date.now()}_${index}`,
                approved: false,
                active: false,
                createdAt: new Date().toISOString()
            }));

        } catch (error) {
            console.error('Error generating personalized rules:', error);
            return this.generateRuleBasedRules(context);
        }
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private static safeJsonParse(text: string, fallback: any): any {
        try {
            const cleaned = this.cleanAIResponse(text);
            return JSON.parse(cleaned);
        } catch (e) {
            console.warn('JSON Parse Error:', e);
            return fallback;
        }
    }

    private static cleanAIResponse(text: string): string {
        try {
            if (!text) return '[]';

            // Remove markdown code blocks
            let clean = text.replace(/```json\n?|```/g, '').trim();

            // Find the first '[' or '{'
            const firstBracket = clean.search(/\[|\{/);
            if (firstBracket !== -1) {
                clean = clean.substring(firstBracket);
            }

            // Find the last ']' or '}'
            const lastBracket = clean.search(/\]|\}(?=[^\]\}]*$)/);
            if (lastBracket !== -1) {
                clean = clean.substring(0, lastBracket + 1);
            }

            if (!clean) return '[]';

            return clean;
        } catch (e) {
            return '[]';
        }
    }

    private static calculateCategoryPatterns(transactions: Transaction[], userId: string) {
        const now = new Date();
        const day7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const day30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const currentWeekday = now.getDay();

        const userTxns = transactions.filter(t => t.from_user_id === userId);

        const categories = [...new Set(userTxns.map(t => t.transaction_type || 'other'))];

        return categories.map(category => {
            const categoryTxns = userTxns.filter(t => (t.transaction_type || 'other') === category);

            const current = categoryTxns
                .filter(t => new Date(t.created_at) >= day7Ago)
                .reduce((sum, t) => sum + t.amount, 0);

            const last7Days = categoryTxns
                .filter(t => {
                    const date = new Date(t.created_at);
                    return date >= new Date(day7Ago.getTime() - 7 * 24 * 60 * 60 * 1000) && date < day7Ago;
                })
                .reduce((sum, t) => sum + t.amount, 0);

            const last30Days = categoryTxns
                .filter(t => {
                    const date = new Date(t.created_at);
                    return date >= new Date(day30Ago.getTime() - 30 * 24 * 60 * 60 * 1000) && date < day30Ago;
                })
                .reduce((sum, t) => sum + t.amount, 0);

            const weekdayTxns = categoryTxns.filter(t => new Date(t.created_at).getDay() === currentWeekday);
            const avgWeekday = weekdayTxns.length > 0
                ? weekdayTxns.reduce((sum, t) => sum + t.amount, 0) / weekdayTxns.length
                : 0;

            const percentChange7Days = last7Days > 0 ? ((current - last7Days) / last7Days) * 100 : 0;
            const percentChange30Days = last30Days > 0 ? ((current - last30Days) / last30Days) * 100 : 0;
            const percentChangeWeekday = avgWeekday > 0 ? ((current / 7 - avgWeekday) / avgWeekday) * 100 : 0;

            const trend = percentChange7Days > 10 ? 'rising' : percentChange7Days < -10 ? 'falling' : 'stable';

            return {
                category,
                currentAmount: current,
                avg7Days: last7Days,
                avg30Days: last30Days,
                avgWeekday,
                percentChange7Days,
                percentChange30Days,
                percentChangeWeekday,
                trend: trend as 'rising' | 'stable' | 'falling',
                insight: `${category} spending is ${Math.abs(percentChange7Days).toFixed(0)}% ${percentChange7Days > 0 ? 'higher' : 'lower'} than last week`
            };
        });
    }

    private static calculateAdvancedPatterns(context: FinancialContext): SpendingPattern[] {
        const { transactions, userId, totalIncome } = context;
        const patterns: SpendingPattern[] = [];
        const userTxns = transactions.filter(t => t.from_user_id === userId);

        // Helper to count unique days in the dataset
        const uniqueDays = new Set<string>();
        const now = new Date();
        const day7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        userTxns.forEach(t => {
            uniqueDays.add(new Date(t.created_at).toDateString());
        });

        const totalDays = Math.max(1, uniqueDays.size);
        const overallDailyAvg = userTxns.reduce((sum, t) => sum + t.amount, 0) / totalDays;

        // 1. Day of Week Analysis
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayTotals = new Array(7).fill(0);
        const dayCounts = new Array(7).fill(0);

        userTxns.forEach(t => {
            const day = new Date(t.created_at).getDay();
            dayTotals[day] += t.amount;
            dayCounts[day]++;
        });

        // Identify significant day patterns
        days.forEach((dayName, index) => {
            if (dayCounts[index] > 0) {
                const numOccurrences = Math.max(1, Math.round(totalDays / 7));
                const avgOnDay = dayTotals[index] / numOccurrences;

                if (avgOnDay > overallDailyAvg * 1.25) {
                    const percentHigher = ((avgOnDay - overallDailyAvg) / overallDailyAvg) * 100;
                    patterns.push({
                        category: dayName + 's',
                        currentAmount: avgOnDay,
                        avg7Days: overallDailyAvg,
                        avg30Days: overallDailyAvg,
                        avgWeekday: overallDailyAvg,
                        percentChange7Days: percentHigher,
                        percentChange30Days: percentHigher,
                        percentChangeWeekday: percentHigher,
                        trend: 'rising',
                        insight: `You spend ${percentHigher.toFixed(0)}% more on ${dayName}s than your daily average.`
                    });
                }
            }
        });

        // Weekend vs Weekday
        const weekendTotal = dayTotals[0] + dayTotals[6];
        const weekdayTotal = dayTotals.slice(1, 6).reduce((a, b) => a + b, 0);
        const numWeekends = Math.max(1, Math.round(totalDays * 2 / 7));
        const numWeekdays = Math.max(1, Math.round(totalDays * 5 / 7));

        const weekendAvg = weekendTotal / numWeekends;
        const weekdayAvg = weekdayTotal / numWeekdays;

        if (weekendAvg > weekdayAvg * 1.2) {
            const percentHigher = ((weekendAvg - weekdayAvg) / weekdayAvg) * 100;
            patterns.push({
                category: 'Weekends',
                currentAmount: weekendAvg,
                avg7Days: overallDailyAvg,
                avg30Days: overallDailyAvg,
                avgWeekday: weekdayAvg,
                percentChange7Days: ((weekendAvg - overallDailyAvg) / overallDailyAvg) * 100,
                percentChange30Days: ((weekendAvg - overallDailyAvg) / overallDailyAvg) * 100,
                percentChangeWeekday: percentHigher,
                trend: 'rising',
                insight: `You spend ${percentHigher.toFixed(0)}% more on weekends than weekdays.`
            });
        }

        // Category-Specific Weekend vs Weekday Analysis
        const categoryWeekendPatterns = this.calculateCategoryWeekendPatterns(userTxns, totalDays);
        patterns.push(...categoryWeekendPatterns);

        // 2. Daily Category Averages (Food, Travel)
        const categoriesOfInterest = ['Food', 'Travel', 'Transport', 'Dining', 'Groceries'];
        const categoryStats: Record<string, { total: number, last7Days: number }> = {};

        userTxns.forEach(t => {
            const cat = t.transaction_type || 'other';
            if (categoriesOfInterest.some(c => cat.toLowerCase().includes(c.toLowerCase()))) {
                if (!categoryStats[cat]) categoryStats[cat] = { total: 0, last7Days: 0 };
                categoryStats[cat].total += t.amount;
                if (new Date(t.created_at) >= day7Ago) {
                    categoryStats[cat].last7Days += t.amount;
                }
            }
        });

        Object.entries(categoryStats).forEach(([cat, stats]) => {
            const dailyAvgOverall = stats.total / totalDays;
            const dailyAvg7Days = stats.last7Days / 7;

            if (dailyAvgOverall > 0) {
                const percentChange = dailyAvg7Days > 0 ? ((dailyAvg7Days - dailyAvgOverall) / dailyAvgOverall) * 100 : 0;

                patterns.push({
                    category: `Daily ${cat}`,
                    currentAmount: dailyAvgOverall,
                    avg7Days: dailyAvg7Days,
                    avg30Days: dailyAvgOverall,
                    avgWeekday: dailyAvgOverall,
                    percentChange7Days: percentChange,
                    percentChange30Days: 0,
                    percentChangeWeekday: 0,
                    trend: percentChange > 10 ? 'rising' : percentChange < -10 ? 'falling' : 'stable',
                    insight: `You spend approx ₹${dailyAvgOverall.toFixed(0)} on ${cat} every day.`
                });
            }
        });

        // 3. Daily Income Analysis
        if (totalIncome > 0) {
            const dailyIncome = totalIncome / 30;
            patterns.push({
                category: 'Daily Income',
                currentAmount: dailyIncome,
                avg7Days: dailyIncome,
                avg30Days: dailyIncome,
                avgWeekday: dailyIncome,
                percentChange7Days: 0,
                percentChange30Days: 0,
                percentChangeWeekday: 0,
                trend: 'stable',
                insight: `You earn approx ₹${dailyIncome.toFixed(0)} per day.`
            });
        }

        return patterns;
    }

    private static calculateCategoryAverages(transactions: Transaction[], userId: string): Record<string, number> {
        const userTxns = transactions.filter(t => t.from_user_id === userId);
        const categories: Record<string, number[]> = {};

        userTxns.forEach(t => {
            const cat = t.transaction_type || 'other';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(t.amount);
        });

        const averages: Record<string, number> = {};
        Object.entries(categories).forEach(([cat, amounts]) => {
            averages[cat] = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
        });

        return averages;
    }

    private static calculateCategoryTrends(transactions: Transaction[], userId: string): CategoryAnalysis[] {
        const patterns = this.calculateCategoryPatterns(transactions, userId);

        return patterns.map(pattern => ({
            category: pattern.category,
            status: pattern.trend === 'rising' ? 'rising' : pattern.trend === 'falling' ? 'reducible' : 'stable',
            currentSpending: pattern.currentAmount,
            previousSpending: pattern.avg7Days,
            percentChange: pattern.percentChange7Days,
            recommendation: '',
            priority: Math.abs(pattern.percentChange7Days) > 30 ? 'high' : Math.abs(pattern.percentChange7Days) > 15 ? 'medium' : 'low'
        }));
    }

    private static analyzeUserPatterns(context: FinancialContext): string[] {
        const patterns: string[] = [];

        // Weekend spending
        const weekendTxns = context.transactions.filter(t => {
            const day = new Date(t.created_at).getDay();
            return (day === 0 || day === 6) && t.from_user_id === context.userId;
        });
        const weekdayTxns = context.transactions.filter(t => {
            const day = new Date(t.created_at).getDay();
            return day > 0 && day < 6 && t.from_user_id === context.userId;
        });

        if (weekendTxns.length > 0 && weekdayTxns.length > 0) {
            const weekendAvg = weekendTxns.reduce((sum, t) => sum + t.amount, 0) / weekendTxns.length;
            const weekdayAvg = weekdayTxns.reduce((sum, t) => sum + t.amount, 0) / weekdayTxns.length;

            if (weekendAvg > weekdayAvg * 1.5) {
                patterns.push('Spends significantly more on weekends');
            }
        }

        // High category spending
        if (context.topCategories.length > 0 && context.topCategories[0].percentage > 40) {
            patterns.push(`High ${context.topCategories[0].category} spending (${context.topCategories[0].percentage}%)`);
        }

        // Frequent transactions
        if (context.transactionCount > 50) {
            patterns.push('Makes many small transactions');
        }

        // Low savings
        if (context.savingsRate < 10) {
            patterns.push('Low savings rate');
        }

        return patterns;
    }

    /**
     * Calculate category-specific weekend vs weekday patterns
     * Identifies which categories drive weekend spending
     */
    private static calculateCategoryWeekendPatterns(
        transactions: Transaction[],
        totalDays: number
    ): SpendingPattern[] {
        const patterns: SpendingPattern[] = [];

        // Group transactions by category
        const categoryMap = new Map<string, { weekend: number[], weekday: number[] }>();

        transactions.forEach(t => {
            const category = t.transaction_type || 'other';
            const day = new Date(t.created_at).getDay();
            const isWeekend = day === 0 || day === 6;

            if (!categoryMap.has(category)) {
                categoryMap.set(category, { weekend: [], weekday: [] });
            }

            const catData = categoryMap.get(category)!;
            if (isWeekend) {
                catData.weekend.push(t.amount);
            } else {
                catData.weekday.push(t.amount);
            }
        });

        // Analyze each category
        const numWeekends = Math.max(1, Math.round(totalDays * 2 / 7));
        const numWeekdays = Math.max(1, Math.round(totalDays * 5 / 7));

        categoryMap.forEach((data, category) => {
            if (data.weekend.length === 0 || data.weekday.length === 0) return;

            const weekendTotal = data.weekend.reduce((sum, amt) => sum + amt, 0);
            const weekdayTotal = data.weekday.reduce((sum, amt) => sum + amt, 0);

            const weekendAvg = weekendTotal / numWeekends;
            const weekdayAvg = weekdayTotal / numWeekdays;

            // Only report if there's a significant difference (30%+)
            if (weekendAvg > weekdayAvg * 1.3) {
                const percentHigher = ((weekendAvg - weekdayAvg) / weekdayAvg) * 100;
                patterns.push({
                    category: `${category} (Weekends)`,
                    currentAmount: weekendAvg,
                    avg7Days: weekendAvg,
                    avg30Days: weekendAvg,
                    avgWeekday: weekdayAvg,
                    percentChange7Days: percentHigher,
                    percentChange30Days: percentHigher,
                    percentChangeWeekday: percentHigher,
                    trend: 'rising',
                    insight: `Your ${category} spending is ${percentHigher.toFixed(0)}% higher on weekends (₹${weekendAvg.toFixed(0)}) vs weekdays (₹${weekdayAvg.toFixed(0)}).`
                });
            } else if (weekdayAvg > weekendAvg * 1.3) {
                const percentHigher = ((weekdayAvg - weekendAvg) / weekendAvg) * 100;
                patterns.push({
                    category: `${category} (Weekdays)`,
                    currentAmount: weekdayAvg,
                    avg7Days: weekdayAvg,
                    avg30Days: weekdayAvg,
                    avgWeekday: weekdayAvg,
                    percentChange7Days: percentHigher,
                    percentChange30Days: percentHigher,
                    percentChangeWeekday: percentHigher,
                    trend: 'rising',
                    insight: `Your ${category} spending is ${percentHigher.toFixed(0)}% higher on weekdays (₹${weekdayAvg.toFixed(0)}) vs weekends (₹${weekendAvg.toFixed(0)}).`
                });
            }
        });

        return patterns;
    }

    private static calculateOverallConfidence(context: FinancialContext): number {
        // Confidence based on data availability
        let confidence = 50;

        if (context.transactionCount > 10) confidence += 10;
        if (context.transactionCount > 30) confidence += 10;
        if (context.transactionCount > 50) confidence += 10;
        if (context.totalIncome > 0) confidence += 10;
        if (context.topCategories.length >= 3) confidence += 10;
        if (context.incomeVolatility && context.incomeVolatility > 0) confidence += 5;

        return Math.min(confidence, 95);
    }

    // Fallback methods when AI is unavailable
    private static getFallbackInsights(): AIInsights {
        return {
            patterns: [],
            predictions: [],
            categoryAnalysis: [],
            coaching: [{
                type: 'tip',
                title: 'AI Unavailable',
                message: 'AI analysis is currently unavailable. Basic insights are shown.',
                priority: 'low'
            }],
            rebalancing: null,
            anomalies: [],
            reductionSuggestions: [],
            personalizedRules: [],
            lastUpdated: new Date().toISOString(),
            confidence: 0
        };
    }

    private static generateRuleBasedPatterns(patterns: any[]): SpendingPattern[] {
        return patterns;
    }

    private static generateRuleBasedPredictions(context: FinancialContext): Prediction[] {
        const predictions: Prediction[] = [];

        // Simple prediction: money depletion
        if (context.totalSpent > 0 && context.totalIncome > 0) {
            const daysInPeriod = context.timeRange === 'week' ? 7 : context.timeRange === 'month' ? 30 : 365;
            const dailySpending = context.totalSpent / daysInPeriod;
            const remainingBudget = context.totalIncome - context.totalSpent;
            const daysUntilDepletion = Math.floor(remainingBudget / dailySpending);

            if (daysUntilDepletion < 30 && daysUntilDepletion > 0) {
                predictions.push({
                    type: 'money_depletion',
                    title: 'Budget Alert',
                    message: `At this pace, you will finish your monthly budget in ${daysUntilDepletion} days.`,
                    severity: daysUntilDepletion < 10 ? 'critical' : 'warning',
                    daysUntil: daysUntilDepletion,
                    confidence: 70
                });
            }
        }

        return predictions;
    }

    private static generateRuleBasedCoaching(context: FinancialContext, insights: any): CoachingAdvice[] {
        const coaching: CoachingAdvice[] = [];

        if (context.savingsRate < 10) {
            coaching.push({
                type: 'warning',
                title: 'Low Savings Rate',
                message: `Your savings rate is ${context.savingsRate.toFixed(1)}%.Try to save at least 20 % of your income.`,
                priority: 'high'
            });
        }

        if (context.savingsRate >= 20) {
            coaching.push({
                type: 'kudos',
                title: 'Great Savings!',
                message: `Excellent! You're saving ${context.savingsRate.toFixed(1)}% of your income. Keep it up!`,
                priority: 'medium'
            });
        }

        return coaching;
    }

    private static generateRuleBasedRebalancing(context: FinancialContext): BudgetRebalanceSuggestion | null {
        if (context.topCategories.length === 0) return null;

        const highestCategory = context.topCategories[0];

        if (highestCategory.percentage > 40) {
            return {
                suggestions: [{
                    fromCategory: highestCategory.category,
                    toCategory: 'savings',
                    amount: Math.round(highestCategory.amount * 0.1),
                    reason: `${highestCategory.category} spending is very high (${highestCategory.percentage}%)`,
                    impact: 'Increase savings by 10%',
                    approved: false
                }],
                totalSavingsIncrease: Math.round(highestCategory.amount * 0.1),
                totalWantsDecrease: Math.round(highestCategory.amount * 0.1),
                message: 'Consider reducing high-spending categories'
            };
        }

        return null;
    }

    private static generateRuleBasedReductions(context: FinancialContext): SpendingReduction[] {
        // Safety check for topCategories
        if (!context.topCategories || context.topCategories.length === 0) {
            return [];
        }

        return context.topCategories.slice(0, 3).map(cat => ({
            category: cat.category,
            currentSpending: cat.amount,
            suggestedReduction: Math.round(cat.amount * 0.15),
            strategies: [
                'Track all expenses in this category',
                'Set a weekly limit',
                'Find cheaper alternatives'
            ],
            potentialSavings: Math.round(cat.amount * 0.15),
            difficulty: 'medium' as const
        }));
    }

    private static generateRuleBasedRules(context: FinancialContext): PersonalizedRule[] {
        const rules: PersonalizedRule[] = [];

        if (context.spendingPattern === 'high') {
            rules.push({
                id: `rule_${Date.now()}_1`,
                type: 'spending_limit',
                title: 'Daily Spending Limit',
                description: 'Set a daily spending limit to control expenses',
                condition: 'Daily spending exceeds ₹500',
                action: 'Alert before transaction',
                learnedFrom: 'High spending pattern detected',
                approved: false,
                active: false,
                createdAt: new Date().toISOString()
            });
        }

        return rules;
    }

    private static getGenericRecommendation(status: string): string {
        switch (status) {
            case 'rising':
                return 'Monitor this category closely and consider reducing expenses';
            case 'reducible':
                return 'Good opportunity to cut back and save more';
            default:
                return 'Maintain current spending level';
        }
    }
}
