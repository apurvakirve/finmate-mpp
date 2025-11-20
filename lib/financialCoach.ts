import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export interface FinancialContext {
    totalIncome: number;
    totalSpent: number;
    savingsRate: number;
    incomeVolatility: number;
    isGigWorker: boolean;
    incomeFrequency: 'weekly' | 'monthly' | 'irregular';
    safeToSpendDaily: number;
    topCategories: Array<{ category: string; amount: number }>;
    upcomingBills: number;
}

export interface CoachInsight {
    type: 'tip' | 'warning' | 'kudos' | 'action';
    title: string;
    message: string;
    actionLabel?: string;
    priority: 'high' | 'medium' | 'low';
}

export const generateProactiveInsights = async (context: FinancialContext): Promise<CoachInsight[]> => {
    if (!GEMINI_API_KEY) {
        console.warn('Gemini API key not found');
        return [];
    }

    try {
        const prompt = `
      You are a Proactive Financial Coach for a user with the following financial profile:
      - Role: ${context.isGigWorker ? 'Gig Worker / Irregular Income' : 'Salaried Employee'}
      - Income Frequency: ${context.incomeFrequency}
      - Income Volatility (StdDev): ${context.incomeVolatility.toFixed(2)}
      - Total Income (Recent): ${context.totalIncome}
      - Total Spent (Recent): ${context.totalSpent}
      - Savings Rate: ${context.savingsRate.toFixed(1)}%
      - Safe Daily Spend Limit: ${context.safeToSpendDaily.toFixed(2)}
      - Upcoming Bills: ${context.upcomingBills}
      
      Goal: Analyze this data and generate 1-2 proactive insights.
      
      Guidelines:
      1. If 'isGigWorker' is true and income is volatile, focus on "Feast or Famine" management. Warn if they are spending too fast on a good week.
      2. If 'safeToSpendDaily' is low, give a specific warning to slow down.
      3. If savings rate is good (>20%), give Kudos.
      4. Keep message short, punchy, and actionable.
      
      Output JSON format:
      [
        {
          "type": "tip" | "warning" | "kudos" | "action",
          "title": "Short Title",
          "message": "One sentence insight.",
          "priority": "high" | "medium" | "low",
          "actionLabel": "Optional button text (e.g. 'View Budget')"
        }
      ]
    `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }]
                }
            ],
            config: {
                responseMimeType: 'application/json',
                temperature: 0.7,
            }
        });

        const text = response.text;
        if (!text) return [];

        // Clean up code blocks if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const insights = JSON.parse(jsonStr) as CoachInsight[];

        return insights;
    } catch (error) {
        console.error('Error generating coach insights:', error);
        return [];
    }
};
