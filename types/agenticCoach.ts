// Agentic Coach Type Definitions

export interface AIAllocationSuggestion {
  jarKey: string;
  jarLabel: string;
  suggestedAmount: number;
  reason: string;
  confidence: number; // 0-100
  priority: number; // 1-10
}

export interface AIInsight {
  type: 'tip' | 'warning' | 'kudos' | 'action';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  actionLabel?: string;
}

export interface AllocationContext {
  currentBalances: Record<string, number>;
  jarTargets: Record<string, number>;
  jarPriorities: Record<string, number>;
  dailyIncome: number;
  goals: Array<{
    jarKey: string;
    jarLabel: string;
    target: number;
    current: number;
    priority: number;
    deadline?: string;
  }>;
  historicalAllocations: any[];
  userPreferences: any;
}

export interface LearningProfile {
  preferredAllocationStyle: 'conservative' | 'balanced' | 'aggressive';
  riskTolerance: number; // 1-10
  savingsPriority: number; // 1-10
  investmentPriority: number; // 1-10
}

