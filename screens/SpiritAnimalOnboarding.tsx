import { useState } from 'react';
import {
    SafeAreaView,
    StyleSheet
} from 'react-native';
import SpiritAnimalQuiz from '../components/SpiritAnimalQuiz';
import SpiritAnimalReveal from '../components/SpiritAnimalReveal';
import { SpiritAnimalType } from '../types/spiritAnimal';

interface SpiritAnimalOnboardingProps {
    onComplete: (animalType: SpiritAnimalType) => void;
}

export default function SpiritAnimalOnboarding({ onComplete }: SpiritAnimalOnboardingProps) {
    const [stage, setStage] = useState<'intro' | 'quiz' | 'reveal'>('quiz');
    const [selectedAnimal, setSelectedAnimal] = useState<SpiritAnimalType | null>(null);

    const handleQuizComplete = (animal: SpiritAnimalType) => {
        setSelectedAnimal(animal);
        setStage('reveal');
    };

    const handleContinue = () => {
        if (selectedAnimal) {
            onComplete(selectedAnimal);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {stage === 'quiz' && (
                <SpiritAnimalQuiz onComplete={handleQuizComplete} />
            )}

            {stage === 'reveal' && selectedAnimal && (
                <SpiritAnimalReveal
                    animalType={selectedAnimal}
                    onContinue={handleContinue}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
});
