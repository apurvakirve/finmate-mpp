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
                                        <Icon name={option.icon as any} size={24} color="#007AFF" />
                                    </View>
                                )}
                                <Text style={styles.optionText}>{option.text}</Text>
                            </View>
                            <Icon name="chevron-right" size={20} color="#999" />
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
        backgroundColor: '#F8F9FA',
        padding: 20,
    },
    progressContainer: {
        marginBottom: 30,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#007AFF',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        fontWeight: '500',
    },
    questionCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    questionNumber: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    questionText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 24,
        lineHeight: 32,
    },
    optionsContainer: {
        gap: 12,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    optionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E3F2FD',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    optionText: {
        fontSize: 16,
        color: '#1a1a1a',
        fontWeight: '500',
        flex: 1,
    },
    helperText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 20,
        fontStyle: 'italic',
    },
});
