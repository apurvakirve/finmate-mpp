import { Feather as Icon } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { PersonalizedRule } from '../types/aiInsights';

interface PersonalizedRuleCardProps {
    rule: PersonalizedRule;
    onApprove?: (rule: PersonalizedRule) => void;
    onReject?: (rule: PersonalizedRule) => void;
    onToggle?: (rule: PersonalizedRule, active: boolean) => void;
}

export default function PersonalizedRuleCard({ rule, onApprove, onReject, onToggle }: PersonalizedRuleCardProps) {
    const [isApproved, setIsApproved] = useState(rule.approved);
    const [isActive, setIsActive] = useState(rule.active);

    const handleApprove = () => {
        setIsApproved(true);
        onApprove?.({ ...rule, approved: true });
    };

    const handleReject = () => {
        onReject?.(rule);
    };

    const handleToggle = (value: boolean) => {
        setIsActive(value);
        onToggle?.(rule, value);
    };

    const getRuleTypeIcon = (type: string) => {
        switch (type) {
            case 'spending_limit': return 'dollar-sign';
            case 'category_limit': return 'tag';
            case 'time_based': return 'clock';
            case 'pattern_based': return 'activity';
            default: return 'shield';
        }
    };

    const getRuleTypeColor = (type: string) => {
        switch (type) {
            case 'spending_limit': return '#DC2626';
            case 'category_limit': return '#F59E0B';
            case 'time_based': return '#3B82F6';
            case 'pattern_based': return '#8B5CF6';
            default: return '#6B7280';
        }
    };

    const getRuleTypeBgColor = (type: string) => {
        switch (type) {
            case 'spending_limit': return '#FEE2E2';
            case 'category_limit': return '#FEF3C7';
            case 'time_based': return '#DBEAFE';
            case 'pattern_based': return '#EDE9FE';
            default: return '#E5E7EB';
        }
    };

    return (
        <View style={[styles.container, isApproved && styles.containerApproved]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={[
                        styles.typeIcon,
                        { backgroundColor: getRuleTypeBgColor(rule.type) }
                    ]}>
                        <Icon
                            name={getRuleTypeIcon(rule.type)}
                            size={20}
                            color={getRuleTypeColor(rule.type)}
                        />
                    </View>
                    <View style={styles.headerText}>
                        <Text style={styles.title}>{rule.title}</Text>
                        <Text style={styles.typeLabel}>
                            {rule.type.replace('_', ' ')}
                        </Text>
                    </View>
                </View>
                {isApproved && (
                    <Switch
                        value={isActive}
                        onValueChange={handleToggle}
                        trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                        thumbColor={isActive ? '#10B981' : '#F3F4F6'}
                    />
                )}
            </View>

            {/* Description */}
            <Text style={styles.description}>{rule.description}</Text>

            {/* Condition & Action */}
            <View style={styles.detailsSection}>
                <View style={styles.detailItem}>
                    <View style={styles.detailHeader}>
                        <Icon name="alert-circle" size={14} color="#6B7280" />
                        <Text style={styles.detailLabel}>When</Text>
                    </View>
                    <Text style={styles.detailText}>{rule.condition}</Text>
                </View>

                <View style={styles.detailItem}>
                    <View style={styles.detailHeader}>
                        <Icon name="zap" size={14} color="#6B7280" />
                        <Text style={styles.detailLabel}>Then</Text>
                    </View>
                    <Text style={styles.detailText}>{rule.action}</Text>
                </View>
            </View>

            {/* Learned From */}
            <View style={styles.learnedSection}>
                <Icon name="cpu" size={14} color="#8B5CF6" />
                <Text style={styles.learnedText}>
                    AI learned this from: <Text style={styles.learnedHighlight}>{rule.learnedFrom}</Text>
                </Text>
            </View>

            {/* Approval Actions */}
            {!isApproved && (onApprove || onReject) && (
                <View style={styles.actions}>
                    {onReject && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={handleReject}
                            activeOpacity={0.7}
                        >
                            <Icon name="x" size={16} color="#DC2626" />
                            <Text style={styles.rejectButtonText}>Reject</Text>
                        </TouchableOpacity>
                    )}
                    {onApprove && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.approveButton]}
                            onPress={handleApprove}
                            activeOpacity={0.7}
                        >
                            <Icon name="check" size={16} color="#FFFFFF" />
                            <Text style={styles.approveButtonText}>Approve & Activate</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Status Badge */}
            {isApproved && (
                <View style={styles.statusBadge}>
                    <Icon
                        name={isActive ? 'check-circle' : 'pause-circle'}
                        size={12}
                        color={isActive ? '#10B981' : '#6B7280'}
                    />
                    <Text style={[
                        styles.statusText,
                        { color: isActive ? '#10B981' : '#6B7280' }
                    ]}>
                        {isActive ? 'Active' : 'Paused'}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    containerApproved: {
        borderColor: '#C7D2FE',
        backgroundColor: '#F5F3FF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    typeIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    typeLabel: {
        fontSize: 11,
        color: '#6B7280',
        textTransform: 'capitalize',
    },
    description: {
        fontSize: 13,
        color: '#4B5563',
        lineHeight: 18,
        marginBottom: 16,
    },
    detailsSection: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        gap: 12,
    },
    detailItem: {
        gap: 6,
    },
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
    },
    detailText: {
        fontSize: 13,
        color: '#1F2937',
        lineHeight: 18,
    },
    learnedSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F3FF',
        padding: 10,
        borderRadius: 10,
        marginBottom: 12,
        gap: 8,
    },
    learnedText: {
        flex: 1,
        fontSize: 12,
        color: '#6B7280',
        lineHeight: 16,
    },
    learnedHighlight: {
        fontWeight: '600',
        color: '#8B5CF6',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        gap: 6,
    },
    rejectButton: {
        backgroundColor: '#FEE2E2',
    },
    rejectButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#DC2626',
    },
    approveButton: {
        backgroundColor: '#8B5CF6',
    },
    approveButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        marginTop: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
