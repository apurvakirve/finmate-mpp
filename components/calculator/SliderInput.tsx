import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TextInput, useTheme } from 'react-native-paper';
import { AIStudioTheme } from '../../constants/aiStudioTheme';


interface SliderInputProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
    unit?: string;
    formatValue?: (value: number) => string;
}

export function SliderInput({
    label,
    value,
    min,
    max,
    step,
    onChange,
    unit = '',
    formatValue,
}: SliderInputProps) {
    const theme = useTheme();
    const [inputValue, setInputValue] = useState(value.toString());

    const handleChangeText = (text: string) => {
        setInputValue(text);

        // Remove non-numeric characters except decimal point
        const numericValue = parseFloat(text.replace(/[^0-9.]/g, ''));

        if (!isNaN(numericValue)) {
            // Clamp value between min and max
            const clampedValue = Math.min(Math.max(numericValue, min), max);
            onChange(clampedValue);
        }
    };

    const handleBlur = () => {
        // On blur, format the value properly
        if (inputValue === '' || isNaN(parseFloat(inputValue))) {
            setInputValue(value.toString());
        } else {
            setInputValue(value.toString());
        }
    };

    const displayValue = formatValue
        ? formatValue(value)
        : value.toLocaleString('en-IN');

    return (
        <View style={styles.container}>
            <Text variant="bodyLarge" style={[styles.label, { color: AIStudioTheme.colors.text }]}>
                {label}
            </Text>
            <TextInput
                mode="outlined"
                value={inputValue}
                onChangeText={handleChangeText}
                onBlur={handleBlur}
                keyboardType="numeric"
                right={<TextInput.Affix text={unit} textStyle={{ color: AIStudioTheme.colors.textSecondary }} />}
                style={[styles.input, { backgroundColor: AIStudioTheme.colors.surfaceVariant }]}
                textColor={AIStudioTheme.colors.text}
                outlineColor={AIStudioTheme.colors.border}
                activeOutlineColor={AIStudioTheme.colors.primary}
            />
            <View style={styles.minMax}>
                <Text variant="bodySmall" style={[styles.minMaxText, { color: AIStudioTheme.colors.textSecondary }]}>
                    Min: {min.toLocaleString('en-IN')}
                </Text>
                <Text variant="bodySmall" style={[styles.minMaxText, { color: AIStudioTheme.colors.textSecondary }]}>
                    Max: {max.toLocaleString('en-IN')}
                </Text>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 12,
    },
    label: {
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        fontSize: 16,
    },
    minMax: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    minMaxText: {
        opacity: 0.6,
    },
});
