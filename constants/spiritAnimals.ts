import { QuizQuestion, SpiritAnimalProfile, SpiritAnimalType } from '../types/spiritAnimal';

// Spirit Animal Profiles
export const SPIRIT_ANIMAL_PROFILES: Record<SpiritAnimalType, SpiritAnimalProfile> = {
    eagle: {
        type: 'eagle',
        name: 'Eagle Investor',
        emoji: '🦅',
        color: '#8B4513',
        accentColor: '#D4A574',
        philosophy: 'Money should work for me',
        description: 'You are a visionary who sees money as a tool for building wealth. You think long-term and aren\'t afraid of calculated risks that can lead to growth.',
        traits: ['Visionary', 'Strategic', 'Growth-Focused', 'Patient'],
        strengths: [
            'Excellent at long-term planning',
            'Comfortable with investments',
            'Sees the bigger picture',
            'Takes calculated risks'
        ],
        weaknesses: [
            'May overlook short-term needs',
            'Can be too focused on growth',
            'Might miss immediate opportunities'
        ],
        riskTolerance: 'high',
        tips: [
            'Diversify your investment portfolio',
            'Don\'t forget emergency savings',
            'Balance growth with stability',
            'Review investments quarterly'
        ],
        coachingStyle: 'Focus on long-term wealth building, investment opportunities, and strategic growth planning'
    },

    squirrel: {
        type: 'squirrel',
        name: 'Squirrel Saver',
        emoji: '🐿️',
        color: '#8B6914',
        accentColor: '#D4AF37',
        philosophy: 'Save for a rainy day',
        description: 'You value security and stability above all. You believe in building a strong financial foundation through consistent saving and careful spending.',
        traits: ['Cautious', 'Security-Focused', 'Conservative', 'Disciplined'],
        strengths: [
            'Excellent at building emergency funds',
            'Very disciplined with savings',
            'Avoids unnecessary risks',
            'Financially secure mindset'
        ],
        weaknesses: [
            'May miss growth opportunities',
            'Can be overly cautious',
            'Might sacrifice experiences for savings'
        ],
        riskTolerance: 'low',
        tips: [
            'Consider low-risk investments',
            'Set aside fun money too',
            'Balance security with enjoyment',
            'Automate your savings'
        ],
        coachingStyle: 'Emphasize safety, emergency funds, and conservative financial strategies'
    },

    butterfly: {
        type: 'butterfly',
        name: 'Butterfly Spender',
        emoji: '🦋',
        color: '#9B59B6',
        accentColor: '#E8DAEF',
        philosophy: 'You only live once',
        description: 'You believe life is meant to be enjoyed now. You value experiences and aren\'t afraid to spend on things that bring you joy and create memories.',
        traits: ['Spontaneous', 'Experience-Driven', 'Present-Focused', 'Adventurous'],
        strengths: [
            'Lives life to the fullest',
            'Creates amazing memories',
            'Not afraid to enjoy money',
            'Spontaneous and fun'
        ],
        weaknesses: [
            'May lack long-term planning',
            'Can overspend on experiences',
            'Might neglect savings'
        ],
        riskTolerance: 'medium-high',
        tips: [
            'Set aside 20% for savings first',
            'Create a fun budget',
            'Plan for future experiences too',
            'Balance present joy with future security'
        ],
        coachingStyle: 'Help balance enjoyment with responsibility, encourage mindful spending'
    },

    lion: {
        type: 'lion',
        name: 'Lion Achiever',
        emoji: '🦁',
        color: '#E67E22',
        accentColor: '#F8C471',
        philosophy: 'Every rupee has a purpose',
        description: 'You are goal-oriented and disciplined. Every financial decision you make is aligned with your clear objectives and long-term vision.',
        traits: ['Goal-Oriented', 'Disciplined', 'Focused', 'Determined'],
        strengths: [
            'Excellent goal-setting skills',
            'Very disciplined approach',
            'Tracks progress meticulously',
            'Achieves financial milestones'
        ],
        weaknesses: [
            'Can be too rigid',
            'May miss spontaneous opportunities',
            'Might stress over small deviations'
        ],
        riskTolerance: 'medium',
        tips: [
            'Set SMART financial goals',
            'Allow flexibility in your plan',
            'Celebrate milestones',
            'Review goals monthly'
        ],
        coachingStyle: 'Focus on goal-based planning, milestone tracking, and achievement strategies'
    },

    capybara: {
        type: 'capybara',
        name: 'capybara Balancer',
        emoji: '🐬',
        color: '#3498DB',
        accentColor: '#AED6F1',
        philosophy: 'Balance is key',
        description: 'You believe in the middle path. You enjoy life while being responsible, save for the future while living in the present, and adapt to changing circumstances.',
        traits: ['Flexible', 'Moderate', 'Well-Rounded', 'Adaptable'],
        strengths: [
            'Balanced financial approach',
            'Adapts to changes easily',
            'Enjoys life responsibly',
            'Well-rounded perspective'
        ],
        weaknesses: [
            'May lack strong direction',
            'Can be indecisive',
            'Might not excel in any area'
        ],
        riskTolerance: 'medium',
        tips: [
            'Use the 50/30/20 budgeting rule',
            'Diversify your approach',
            'Stay flexible with plans',
            'Balance all financial aspects'
        ],
        coachingStyle: 'Provide balanced advice, adaptable strategies, and holistic financial planning'
    },

    fox: {
        type: 'fox',
        name: 'Fox Optimizer',
        emoji: '🦊',
        color: '#E74C3C',
        accentColor: '#F5B7B1',
        philosophy: 'Smart spending is the best spending',
        description: 'You are strategic and analytical. You maximize value from every rupee, research before buying, and always find the best deals.',
        traits: ['Strategic', 'Value-Focused', 'Analytical', 'Resourceful'],
        strengths: [
            'Excellent at finding deals',
            'Maximizes value always',
            'Research-driven decisions',
            'Minimizes waste'
        ],
        weaknesses: [
            'Can overthink purchases',
            'May miss time-sensitive opportunities',
            'Might focus too much on optimization'
        ],
        riskTolerance: 'medium-low',
        tips: [
            'Use comparison tools',
            'Track your optimizations',
            'Balance time vs savings',
            'Automate routine decisions'
        ],
        coachingStyle: 'Focus on optimization tips, value maximization, and strategic spending'
    }
};

// Quiz Questions
export const QUIZ_QUESTIONS: QuizQuestion[] = [
    {
        id: 'q1',
        question: 'What\'s your life philosophy when it comes to money?',
        options: [
            {
                id: 'q1_eagle',
                text: 'Money is a tool to build wealth and freedom',
                animal: 'eagle',
                icon: 'trending-up'
            },
            {
                id: 'q1_squirrel',
                text: 'Security first - save for rainy days',
                animal: 'squirrel',
                icon: 'shield'
            },
            {
                id: 'q1_butterfly',
                text: 'You only live once - enjoy the journey',
                animal: 'butterfly',
                icon: 'sun'
            },
            {
                id: 'q1_lion',
                text: 'Every rupee should serve my goals',
                animal: 'lion',
                icon: 'target'
            },
            {
                id: 'q1_capybara',
                text: 'Balance today\'s joy with tomorrow\'s security',
                animal: 'capybara',
                icon: 'activity'
            },
            {
                id: 'q1_fox',
                text: 'Smart decisions maximize every opportunity',
                animal: 'fox',
                icon: 'zap'
            }
        ]
    },
    {
        id: 'q2',
        question: 'When you receive unexpected money...',
        options: [
            {
                id: 'q2_eagle',
                text: 'Invest it for future growth',
                animal: 'eagle',
                icon: 'bar-chart-2'
            },
            {
                id: 'q2_squirrel',
                text: 'Add it to emergency fund',
                animal: 'squirrel',
                icon: 'lock'
            },
            {
                id: 'q2_butterfly',
                text: 'Treat yourself to something special',
                animal: 'butterfly',
                icon: 'gift'
            },
            {
                id: 'q2_lion',
                text: 'Put it toward a specific goal',
                animal: 'lion',
                icon: 'flag'
            },
            {
                id: 'q2_capybara',
                text: 'Split between fun and savings',
                animal: 'capybara',
                icon: 'pie-chart'
            },
            {
                id: 'q2_fox',
                text: 'Research the best use for it',
                animal: 'fox',
                icon: 'search'
            }
        ]
    },
    {
        id: 'q3',
        question: 'Your approach to financial risk is...',
        options: [
            {
                id: 'q3_eagle',
                text: 'Calculated risks lead to rewards',
                animal: 'eagle',
                icon: 'trending-up'
            },
            {
                id: 'q3_squirrel',
                text: 'Better safe than sorry',
                animal: 'squirrel',
                icon: 'shield'
            },
            {
                id: 'q3_butterfly',
                text: 'Fortune favors the bold',
                animal: 'butterfly',
                icon: 'award'
            },
            {
                id: 'q3_lion',
                text: 'Risk only for important goals',
                animal: 'lion',
                icon: 'crosshair'
            },
            {
                id: 'q3_capybara',
                text: 'Moderate risk is fine',
                animal: 'capybara',
                icon: 'sliders'
            },
            {
                id: 'q3_fox',
                text: 'Minimize risk, maximize return',
                animal: 'fox',
                icon: 'minimize-2'
            }
        ]
    },
    {
        id: 'q4',
        question: 'When making a big purchase...',
        options: [
            {
                id: 'q4_eagle',
                text: 'Consider long-term value',
                animal: 'eagle',
                icon: 'clock'
            },
            {
                id: 'q4_squirrel',
                text: 'Ensure I have savings first',
                animal: 'squirrel',
                icon: 'check-circle'
            },
            {
                id: 'q4_butterfly',
                text: 'If I want it, I get it',
                animal: 'butterfly',
                icon: 'heart'
            },
            {
                id: 'q4_lion',
                text: 'Check if it fits my plan',
                animal: 'lion',
                icon: 'clipboard'
            },
            {
                id: 'q4_capybara',
                text: 'Balance need vs want',
                animal: 'capybara',
                icon: 'scale'
            },
            {
                id: 'q4_fox',
                text: 'Compare all options first',
                animal: 'fox',
                icon: 'list'
            }
        ]
    },
    {
        id: 'q5',
        question: 'Your financial planning style is...',
        options: [
            {
                id: 'q5_eagle',
                text: 'Long-term wealth building',
                animal: 'eagle',
                icon: 'arrow-up-right'
            },
            {
                id: 'q5_squirrel',
                text: 'Conservative and steady',
                animal: 'squirrel',
                icon: 'anchor'
            },
            {
                id: 'q5_butterfly',
                text: 'Minimal planning, go with flow',
                animal: 'butterfly',
                icon: 'wind'
            },
            {
                id: 'q5_lion',
                text: 'Detailed goals and milestones',
                animal: 'lion',
                icon: 'map'
            },
            {
                id: 'q5_capybara',
                text: 'Flexible with general direction',
                animal: 'capybara',
                icon: 'navigation'
            },
            {
                id: 'q5_fox',
                text: 'Optimized for efficiency',
                animal: 'fox',
                icon: 'cpu'
            }
        ]
    },
    {
        id: 'q6',
        question: 'What drives your financial decisions?',
        options: [
            {
                id: 'q6_eagle',
                text: 'Future potential and growth opportunities',
                animal: 'eagle',
                icon: 'sunrise'
            },
            {
                id: 'q6_squirrel',
                text: 'Safety, stability, and peace of mind',
                animal: 'squirrel',
                icon: 'shield'
            },
            {
                id: 'q6_butterfly',
                text: 'Experiences and living in the moment',
                animal: 'butterfly',
                icon: 'smile'
            },
            {
                id: 'q6_lion',
                text: 'Achieving specific dreams and milestones',
                animal: 'lion',
                icon: 'award'
            },
            {
                id: 'q6_capybara',
                text: 'Maintaining flexibility and options',
                animal: 'capybara',
                icon: 'compass'
            },
            {
                id: 'q6_fox',
                text: 'Getting the best value and outcomes',
                animal: 'fox',
                icon: 'star'
            }
        ]
    },
    {
        id: 'q7',
        question: 'How do you view money\'s role in your happiness?',
        options: [
            {
                id: 'q7_eagle',
                text: 'It buys freedom and opportunities',
                animal: 'eagle',
                icon: 'unlock'
            },
            {
                id: 'q7_squirrel',
                text: 'It provides security and reduces stress',
                animal: 'squirrel',
                icon: 'heart'
            },
            {
                id: 'q7_butterfly',
                text: 'It enables amazing experiences and memories',
                animal: 'butterfly',
                icon: 'camera'
            },
            {
                id: 'q7_lion',
                text: 'It helps me achieve what matters most',
                animal: 'lion',
                icon: 'check-circle'
            },
            {
                id: 'q7_capybara',
                text: 'It supports a well-rounded, fulfilling life',
                animal: 'capybara',
                icon: 'life-buoy'
            },
            {
                id: 'q7_fox',
                text: 'It\'s a resource to be optimized wisely',
                animal: 'fox',
                icon: 'tool'
            }
        ]
    }
];

// Scoring Algorithm
export function calculateSpiritAnimal(answers: { animal: SpiritAnimalType }[]): SpiritAnimalType {
    const scores: Record<SpiritAnimalType, number> = {
        eagle: 0,
        squirrel: 0,
        butterfly: 0,
        lion: 0,
        capybara: 0,
        fox: 0
    };

    // Count votes for each animal
    answers.forEach(answer => {
        scores[answer.animal]++;
    });

    // Find the animal with highest score
    let maxScore = 0;
    let winningAnimal: SpiritAnimalType = 'capybara'; // Default to balanced

    Object.entries(scores).forEach(([animal, score]) => {
        if (score > maxScore) {
            maxScore = score;
            winningAnimal = animal as SpiritAnimalType;
        }
    });

    return winningAnimal;
}

// Get profile by type
export function getSpiritAnimalProfile(type: SpiritAnimalType): SpiritAnimalProfile {
    return SPIRIT_ANIMAL_PROFILES[type];
}

// Get all profiles
export function getAllSpiritAnimalProfiles(): SpiritAnimalProfile[] {
    return Object.values(SPIRIT_ANIMAL_PROFILES);
}
