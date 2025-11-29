import { Feather as Icon } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { AIStudioTheme } from '../constants/aiStudioTheme';
import { QUIZ_QUESTIONS, calculateSpiritAnimal } from '../constants/spiritAnimals';
import { QuizAnswer, SpiritAnimalType } from '../types/spiritAnimal';

const { width } = Dimensions.get('window');

interface SpiritAnimalQuizProps {
    onComplete: (animal: SpiritAnimalType) => void;
}

export default function SpiritAnimalQuiz({ onComplete }: SpiritAnimalQuizProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<QuizAnswer[]>([]);
    const [slideAnim] = useState(new Animated.Value(0));

    const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / QUIZ_QUESTIONS.length) * 100;

    const handleAnswer = (animal: SpiritAnimalType, optionId: string) => {
        const newAnswer: QuizAnswer = {
            questionId: currentQuestion.id,
            selectedOption: optionId,
            animal
        };

        const newAnswers = [...answers, newAnswer];
        setAnswers(newAnswers);

        // Animate slide out
        Animated.timing(slideAnim, {
            toValue: -width,
            duration: 300,
            useNativeDriver: true
        }).start(() => {
            if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
                // Move to next question
                setCurrentQuestionIndex(currentQuestionIndex + 1);
                slideAnim.setValue(width);
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true
                }).start();
            } else {
                // Quiz complete - calculate result
                const resultAnimal = calculateSpiritAnimal(newAnswers);
                onComplete(resultAnimal);
            }
        });
    };

    return (
        <View style={styles.container}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>
                    {currentQuestionIndex + 1} of {QUIZ_QUESTIONS.length}
                </Text>
            </View>

            {/* Question Card */}
            <Animated.View
                style={[
                    styles.questionCard,
                    { transform: [{ translateX: slideAnim }] }
                ]}
            >
                <Text style={styles.questionNumber}>Question {currentQuestionIndex + 1}</Text>
                <Text style={styles.questionText}>{currentQuestion.question}</Text>

                {/* Options */}
                <View style={styles.optionsContainer}>
                    {currentQuestion.options.map((option, index) => (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.optionButton,
                                {
                                    opacity: 1,
                                    transform: [{ scale: 1 }]
                                }
                            ]}
                            onPress={() => handleAnswer(option.animal, option.id)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.optionContent}>
                                {option.icon && (
                                    <View style={styles.optionIcon}>
                                        <Icon name={option.icon as any} size={20} color={AIStudioTheme.colors.primary} />
                                    </View>
                                )}
                                <Text style={styles.optionText}>{option.text}</Text>
                            </View>
                            <Icon name="chevron-right" size={18} color={AIStudioTheme.colors.textMuted} />
                        </TouchableOpacity>
                    ))}
                </View>
            </Animated.View>

            {/* Helper Text */}
            <Text style={styles.helperText}>
                Choose the option that best describes you
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AIStudioTheme.colors.background,
    },
    progressContainer: {
        marginBottom: 20,
    },
    progressBar: {
        height: 3,
        backgroundColor: AIStudioTheme.colors.surfaceVariant,
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 6,
    },
    progressFill: {
        height: '100%',
        backgroundColor: AIStudioTheme.colors.primary,
        borderRadius: 2,
    },
    progressText: {
        fontSize: 12,
        color: AIStudioTheme.colors.textSecondary,
        textAlign: 'center',
        fontWeight: '500',
    },
    questionCard: {
        backgroundColor: AIStudioTheme.colors.surface,
        borderRadius: 16,
        padding: 18,
        ...AIStudioTheme.shadows.lg,
        borderWidth: 1,
        borderColor: AIStudioTheme.colors.border,
        minHeight: 480,
    },
    questionNumber: {
        fontSize: 12,
        color: AIStudioTheme.colors.primary,
        fontWeight: '600',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    questionText: {
        fontSize: 18,
        fontWeight: '700',
        color: AIStudioTheme.colors.text,
        marginBottom: 18,
        lineHeight: 26,
    },
    optionsContainer: {
        gap: 10,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: AIStudioTheme.colors.surfaceVariant,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: AIStudioTheme.colors.border,
        minHeight: 52,
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    optionIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: AIStudioTheme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: AIStudioTheme.colors.border,
    },
    optionText: {
        fontSize: 14,
        color: AIStudioTheme.colors.text,
        fontWeight: '500',
        flex: 1,
        lineHeight: 20,
    },
    helperText: {
        fontSize: 12,
        color: AIStudioTheme.colors.textMuted,
        textAlign: 'center',
        marginTop: 16,
        fontStyle: 'italic',
    },
});
