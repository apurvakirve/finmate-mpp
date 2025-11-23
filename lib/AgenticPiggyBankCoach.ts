import { AIAllocationSuggestion, AIInsight, AllocationContext, LearningProfile } from '../types/agenticCoach';
import { SpiritAnimalType } from '../types/spiritAnimal';

/**
 * Agentic PiggyBank Coach
 * Provides AI-powered allocation suggestions and insights for piggy bank jars
 */
export class AgenticPiggyBankCoach {
  private userId: string;
  private learningProfile: LearningProfile;
  private spiritAnimalType: SpiritAnimalType | null = null;

  constructor(userId: string) {
    this.userId = userId;
    this.learningProfile = {
      preferredAllocationStyle: 'balanced',
      riskTolerance: 5,
      savingsPriority: 6,
      investmentPriority: 5,
    };
  }

  setSpiritAnimal(type: SpiritAnimalType | null) {
    this.spiritAnimalType = type;
    // Adjust learning profile based on spirit animal
    if (type === 'butterfly') {
      // YOLO users - more flexible, less restrictive
      this.learningProfile.preferredAllocationStyle = 'aggressive';
      this.learningProfile.riskTolerance = 8;
    } else if (type === 'squirrel') {
      // Conservative savers
      this.learningProfile.preferredAllocationStyle = 'conservative';
      this.learningProfile.savingsPriority = 9;
    } else if (type === 'eagle') {
      // Visionary investors
      this.learningProfile.investmentPriority = 8;
    }
  }

  /**
   * Initialize the coach (load user preferences, etc.)
   */
  async initialize(): Promise<void> {
    // Load user preferences from storage if needed
    // For now, use defaults
    return Promise.resolve();
  }

  /**
   * Analyze current state and suggest allocations
   */
  async analyzeAndSuggest(context: AllocationContext): Promise<AIAllocationSuggestion[]> {
    const suggestions: AIAllocationSuggestion[] = [];
    const { dailyIncome, goals, jarPriorities } = context;

    if (dailyIncome <= 0) {
      return suggestions;
    }

    // Simple priority-based allocation algorithm
    const totalPriority = goals.reduce((sum, goal) => {
      return sum + (goal.priority || jarPriorities[goal.jarKey] || 5);
    }, 0);

    if (totalPriority === 0) {
      return suggestions;
    }

    // Allocate based on priority and target gaps
    goals.forEach((goal) => {
      const priority = goal.priority || jarPriorities[goal.jarKey] || 5;
      const target = goal.target || 0;
      const current = goal.current || 0;
      const gap = Math.max(0, target - current);

      if (gap > 0 && priority >= 5) {
        const weight = priority / totalPriority;
        const suggestedAmount = Math.floor(dailyIncome * weight * 0.3); // Allocate 30% of income based on priority

        if (suggestedAmount > 0) {
          suggestions.push({
            jarKey: goal.jarKey,
            jarLabel: goal.jarLabel,
            suggestedAmount,
            reason: `Priority-based allocation to reach target of ₹${target.toLocaleString('en-IN')}`,
            confidence: Math.min(90, 50 + priority * 5),
            priority,
          });
        }
      }
    });

    // Sort by priority (highest first)
    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate financial insights with allocation messages
   */
  async generateInsights(
    context: AllocationContext,
    allocations: Record<string, number>
  ): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    const { dailyIncome, goals, currentBalances, jarTargets } = context;

    if (dailyIncome <= 0) {
      return insights;
    }

    // Generate allocation messages for each jar
    goals.forEach((goal) => {
      const dailyAmount = allocations[goal.jarKey] || 0;
      const target = jarTargets?.[goal.jarKey] || goal.target || 0;
      const current = goal.current || 0;

      if (dailyAmount > 0 && target > 0) {
        const message = this.generateAllocationMessage(
          goal.jarKey,
          goal.jarLabel,
          dailyAmount,
          target,
          current
        );
        insights.push({
          type: 'tip',
          title: `${goal.jarLabel} Allocation`,
          message: message,
          priority: goal.priority >= 7 ? 'high' : 'medium',
        });
      }
    });

    // Check for jars close to target
    goals.forEach((goal) => {
      const current = goal.current || 0;
      const target = goal.target || 0;
      if (target > 0) {
        const progress = (current / target) * 100;
        if (progress >= 80 && progress < 100) {
          insights.push({
            type: 'kudos',
            title: `Almost there!`,
            message: `${goal.jarLabel} is ${progress.toFixed(0)}% complete. Keep it up!`,
            priority: 'medium',
          });
        }
      }
    });

    // Spirit animal specific insights
    if (this.spiritAnimalType === 'butterfly') {
      insights.push({
        type: 'tip',
        title: 'YOLO Mode Active',
        message: 'We\'ve kept your wants allocation flexible. Remember to balance fun with future needs!',
        priority: 'low',
      });
    }

    return insights;
  }

  /**
   * Learn from user's actual allocation decisions
   * This adjusts priorities based on what the user actually allocates
   */
  async learnFromAllocation(
    allocations: Record<string, number>,
    dailyIncome: number,
    jarTargets: Record<string, number>,
    currentBalances: Record<string, number>
  ): Promise<void> {
    // Analyze what user allocated and adjust priorities
    Object.entries(allocations).forEach(([jarKey, amount]) => {
      if (amount <= 0) return;

      const percentage = (amount / dailyIncome) * 100;
      const target = jarTargets[jarKey] || 0;
      const current = currentBalances[jarKey] || 0;
      const gap = target > 0 ? target - current : 0;

      // If user allocates more to jars with targets, increase priority
      if (jarKey.includes('savings') || jarKey.includes('emergency')) {
        if (gap > 0 && percentage > 10) {
          this.learningProfile.savingsPriority = Math.min(10, this.learningProfile.savingsPriority + 0.5);
        }
      }
      if (jarKey.includes('invest')) {
        if (gap > 0 && percentage > 5) {
          this.learningProfile.investmentPriority = Math.min(10, this.learningProfile.investmentPriority + 0.5);
        }
      }
    });

    return Promise.resolve();
  }

  /**
   * Get AI-adjusted priorities for jars
   * This influences the main allocation calculation
   * Considers spirit animal, targets, and balances
   */
  getAdjustedPriorities(
    defaultPriorities: Record<string, number>,
    jarTargets: Record<string, number>,
    currentBalances: Record<string, number>,
    jarBuckets: Record<string, string>
  ): Record<string, number> {
    const adjusted = { ...defaultPriorities };
    const isYOLO = this.spiritAnimalType === 'butterfly';

    // Adjust based on learning profile and target gaps
    Object.keys(adjusted).forEach((jarKey) => {
      const target = jarTargets[jarKey] || 0;
      const current = currentBalances[jarKey] || 0;
      const gap = target - current;
      const progress = target > 0 ? (current / target) * 100 : 0;
      const bucket = jarBuckets[jarKey];

      // Priority rules:
      // 1. Needs (fixed and variable) - highest priority
      // 2. Savings - high priority (but flexible for YOLO users)
      // 3. Wants - lower priority, can be cut if needed
      // 4. Investments - medium priority

      if (bucket === 'needs-fixed' || bucket === 'needs-variable') {
        // Needs always get high priority
        if (gap > 0 && progress < 80) {
          adjusted[jarKey] = Math.min(10, adjusted[jarKey] + 2);
        }
      } else if (bucket === 'savings') {
        // Savings priority (but less strict for YOLO users)
        if (gap > 0 && progress < 80) {
          const boost = isYOLO ? 0.5 : 1.5;
          adjusted[jarKey] = Math.min(10, adjusted[jarKey] + boost);
        }
      } else if (bucket === 'wants') {
        // Wants can be reduced if needs/savings are behind
        if (isYOLO) {
          // YOLO users - don't cut too much (keep at least 50% of wants)
          adjusted[jarKey] = Math.max(adjusted[jarKey] * 0.5, adjusted[jarKey] - 1);
        } else {
          // Others - can cut wants more if needed
          adjusted[jarKey] = Math.max(1, adjusted[jarKey] - 1);
        }
      } else if (bucket === 'invest') {
        // Investments - moderate priority
        if (gap > 0 && progress < 80) {
          adjusted[jarKey] = Math.min(10, adjusted[jarKey] + this.learningProfile.investmentPriority / 3);
        }
      }

      // Reduce priority for jars that are close to target
      if (progress >= 90) {
        adjusted[jarKey] = Math.max(1, adjusted[jarKey] - 1);
      }
    });

    return adjusted;
  }

  /**
   * Generate allocation message showing daily amount and target date
   */
  generateAllocationMessage(
    jarKey: string,
    jarLabel: string,
    dailyAmount: number,
    target: number,
    current: number
  ): string {
    if (target <= 0 || dailyAmount <= 0) {
      return `Allocate ₹${dailyAmount.toFixed(0)} daily to ${jarLabel}`;
    }

    const gap = target - current;
    const daysNeeded = Math.ceil(gap / dailyAmount);
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysNeeded);

    if (daysNeeded <= 7) {
      return `₹${dailyAmount.toFixed(0)}/day → Target in ${daysNeeded} days (${targetDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`;
    } else if (daysNeeded <= 30) {
      return `₹${dailyAmount.toFixed(0)}/day → Target in ${daysNeeded} days`;
    } else {
      const months = Math.ceil(daysNeeded / 30);
      return `₹${dailyAmount.toFixed(0)}/day → Target in ~${months} month${months > 1 ? 's' : ''}`;
    }
  }

  /**
   * Check for overspending and generate alerts
   */
  checkOverspending(
    jarKey: string,
    jarLabel: string,
    jarBalance: number,
    spentAmount: number,
    upcomingBills: number
  ): AIInsight | null {
    if (spentAmount <= jarBalance) return null;

    const overspent = spentAmount - jarBalance;
    const messages: string[] = [];

    if (upcomingBills > 0) {
      messages.push(`You've overspent ₹${overspent.toFixed(0)} on ${jarLabel}. Bills of ₹${upcomingBills.toLocaleString('en-IN')} are coming - you might need to save more.`);
    } else {
      messages.push(`You've overspent ₹${overspent.toFixed(0)} on ${jarLabel}. Consider reducing spending in this category.`);
    }

    // Check if it affects other priorities
    if (jarKey.includes('wants') || jarKey.includes('treats')) {
      messages.push(`This overspending might affect your savings goals. Try to balance wants with needs.`);
    }

    return {
      type: 'warning',
      title: 'Overspending Alert',
      message: messages.join(' '),
      priority: overspent > jarBalance * 0.5 ? 'high' : 'medium',
    };
  }

  /**
   * Learn from user feedback (kept for backward compatibility)
   */
  async learnFromFeedback(
    suggestion: AIAllocationSuggestion,
    approved: boolean,
    actualAmount?: number
  ): Promise<void> {
    // This method is now deprecated but kept for compatibility
    return Promise.resolve();
  }

  /**
   * Explain a decision or answer a question
   */
  async explainDecision(question: string, context: AllocationContext): Promise<string> {
    // Simple explanation based on context
    return `Based on your current balances and priorities, I'm suggesting allocations that help you reach your jar targets while maintaining a balanced approach to savings and investments.`;
  }

  /**
   * Get the current learning profile
   */
  getLearningProfile(): LearningProfile {
    return { ...this.learningProfile };
  }
}

