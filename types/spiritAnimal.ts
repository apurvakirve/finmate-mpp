// Financial Spirit Animal Type Definitions

export type SpiritAnimalType =
    | 'eagle'      // Eagle Investor - Visionary
    | 'squirrel'   // Squirrel Saver - Conservative
    | 'butterfly'  // Butterfly Spender - YOLO
    | 'lion'       // Lion Achiever - Goal-Oriented
    | 'capybara'   // Capybara Balancer - Balanced
    | 'fox';       // Fox Optimizer - Strategic

export interface QuizQuestion {
    id: string;
    question: string;
    options: QuizOption[];
}

export interface QuizOption {
    id: string;
    text: string;
    animal: SpiritAnimalType;
    icon?: string;
}

export interface QuizAnswer {
    questionId: string;
    selectedOption: string;
    animal: SpiritAnimalType;
}

export interface SpiritAnimalProfile {
    type: SpiritAnimalType;
    name: string;
    emoji: string;
    color: string;
    accentColor: string;
    philosophy: string;
    description: string;
    traits: string[];
    strengths: string[];
    weaknesses: string[];
    riskTolerance: 'low' | 'medium-low' | 'medium' | 'medium-high' | 'high';
    tips: string[];
    coachingStyle: string;
}

export interface UserSpiritAnimal {
    type: SpiritAnimalType;
    completedAt: string;
    traits: {
        riskTolerance: string;
        savingStyle: string;
        spendingStyle: string;
        planningStyle: string;
    };
}

export interface QuizResult {
    animal: SpiritAnimalType;
    scores: Record<SpiritAnimalType, number>;
    profile: SpiritAnimalProfile;
}
