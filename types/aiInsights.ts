// AI Insights Type Definitions

export interface Transaction {
    id: string;
    from_user_id: string;
    to_user_id: string;
    from_name: string;
    to_name: string;
    amount: number;
    type: string;
    method?: string;
    transaction_type: string;
    created_at: string;
}

// STEP 1: Spending Pattern Detection
export interface SpendingPattern {
    category: string;
    currentAmount: number;
    avg7Days: number;
    avg30Days: number;
    avgWeekday: number;
    percentChange7Days: number;
    percentChange30Days: number;
    percentChangeWeekday: number;
    trend: 'rising' | 'stable' | 'falling';
    insight: string;
}

// STEP 2: Predictions
export interface Prediction {
    type: 'overspend_week' | 'overspend_month' | 'savings_target' | 'category_limit' | 'money_depletion';
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
    daysUntil?: number;
    amount?: number;
    category?: string;
    confidence: number; // 0-100
}

// STEP 3: Category Analysis
export interface CategoryAnalysis {
    category: string;
    status: 'rising' | 'stable' | 'reducible';
    currentSpending: number;
    previousSpending: number;
    percentChange: number;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
}

// STEP 4: Personal Coaching
export interface CoachingAdvice {
    type: 'tip' | 'warning' | 'action' | 'kudos';
    title: string;
    message: string;
    actionLabel?: string;
    actionData?: any;
    priority: 'high' | 'medium' | 'low';
    category?: string;
}

// STEP 5: Budget Rebalancing
export interface BudgetRebalance {
    fromCategory: string;
    toCategory: string;
    amount: number;
    reason: string;
    impact: string;
    approved: boolean;
}

export interface BudgetRebalanceSuggestion {
    suggestions: BudgetRebalance[];
    totalSavingsIncrease: number;
    totalWantsDecrease: number;
    message: string;
}

// STEP 6: Anomaly Detection
export interface Anomaly {
    transactionId: string;
    amount: number;
    category: string;
    date: string;
    normalAmount: number;
    deviationMultiple: number; // e.g., 8 means 8x higher
    message: string;
    severity: 'low' | 'medium' | 'high';
    confirmed: boolean;
    flagged: boolean;
}

// STEP 7: Spending Reduction Suggestions
export interface SpendingReduction {
    category: string;
    currentSpending: number;
    suggestedReduction: number;
    strategies: string[];
    potentialSavings: number;
    difficulty: 'easy' | 'medium' | 'hard';
}

// STEP 8: Personalized Rules
export interface PersonalizedRule {
    id: string;
    type: 'spending_limit' | 'category_limit' | 'time_based' | 'pattern_based';
    title: string;
    description: string;
    condition: string;
    action: string;
    learnedFrom: string; // What pattern triggered this rule
    approved: boolean;
    active: boolean;
    createdAt: string;
}

// Combined AI Insights
export interface AIInsights {
    patterns: SpendingPattern[];
    predictions: Prediction[];
    categoryAnalysis: CategoryAnalysis[];
    coaching: CoachingAdvice[];
    rebalancing: BudgetRebalanceSuggestion | null;
    anomalies: Anomaly[];
    reductionSuggestions: SpendingReduction[];
    personalizedRules: PersonalizedRule[];
    lastUpdated: string;
    confidence: number; // Overall confidence in insights
}

// User Financial Context for AI
export interface FinancialContext {
    userId: string;
    totalIncome: number;
    totalSpent: number;
    totalSaved: number;
    savingsRate: number;
    incomeVolatility: number;
    isGigWorker: boolean;
    incomeFrequency: 'weekly' | 'monthly' | 'irregular';
    safeToSpendDaily: number;
    topCategories: Array<{ category: string; amount: number; percentage: number }>;
    upcomingBills: number;
    transactionCount: number;
    spendingPattern: 'high' | 'moderate' | 'low';
    transactions: Transaction[];
    timeRange: 'week' | 'month' | 'year';
}

// AI Analysis Request
export interface AIAnalysisRequest {
    context: FinancialContext;
    analysisTypes: Array<'patterns' | 'predictions' | 'anomalies' | 'coaching' | 'rebalancing' | 'rules'>;
    forceRefresh?: boolean;
}

// AI Analysis Response
export interface AIAnalysisResponse {
    insights: AIInsights;
    cached: boolean;
    timestamp: string;
    error?: string;
}
