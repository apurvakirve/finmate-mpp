import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Text, useTheme } from 'react-native-paper';

interface PieChartViewProps {
    invested: number;
    returns: number;
    investedLabel?: string;
    returnsLabel?: string;
}

export function PieChartView({
    invested,
    returns,
    investedLabel = 'Invested',
    returnsLabel = 'Returns',
}: PieChartViewProps) {
    const theme = useTheme();
    const screenWidth = Dimensions.get('window').width;

    // Format numbers with Indian locale
    const formatCurrency = (value: number) => {
        return value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    };

    const data = [
        {
            name: `${investedLabel}: ₹${formatCurrency(invested)}`,
            amount: invested,
            color: theme.colors.primary,
            legendFontColor: theme.dark ? '#fff' : '#333',
            legendFontSize: 13,
        },
        {
            name: `${returnsLabel}: ₹${formatCurrency(returns)}`,
            amount: returns,
            color: '#4CAF50',
            legendFontColor: theme.dark ? '#fff' : '#333',
            legendFontSize: 13,
        },
    ];

    const chartConfig = {
        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        backgroundColor: theme.dark ? '#1a1a1a' : '#ffffff',
        backgroundGradientFrom: theme.dark ? '#1a1a1a' : '#ffffff',
        backgroundGradientTo: theme.dark ? '#1a1a1a' : '#ffffff',
    };

    return (
        <View style={styles.container}>
            <Text variant="titleMedium" style={styles.title}>
                Investment Breakdown
            </Text>
            <PieChart
                data={data}
                width={screenWidth - 64}
                height={220}
                chartConfig={chartConfig}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
        alignItems: 'center',
    },
    title: {
        marginBottom: 16,
        fontWeight: '600',
    },
});
