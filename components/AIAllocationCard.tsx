import { Feather as Icon } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { AIAllocationSuggestion } from '../types/agenticCoach';

interface AIAllocationCardProps {
  suggestion: AIAllocationSuggestion;
  onApprove: () => void;
  onReject: () => void;
  onModify: (amount: number) => void;
}

export default function AIAllocationCard({
  suggestion,
  onApprove,
  onReject,
  onModify,
}: AIAllocationCardProps) {
  const [isModifying, setIsModifying] = useState(false);
  const [modifiedAmount, setModifiedAmount] = useState(String(suggestion.suggestedAmount));

  const handleModify = () => {
    const amount = parseFloat(modifiedAmount);
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    onModify(amount);
    setIsModifying(false);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return '#34C759';
    if (confidence >= 50) return '#FF9500';
    return '#FF3B30';
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.confidenceBadge, { backgroundColor: `${getConfidenceColor(suggestion.confidence)}15` }]}>
            <Text style={[styles.confidenceText, { color: getConfidenceColor(suggestion.confidence) }]}>
              {suggestion.confidence}% confident
            </Text>
          </View>
          <Text style={styles.jarLabel}>{suggestion.jarLabel}</Text>
        </View>
        <Text style={styles.amount}>₹{suggestion.suggestedAmount.toLocaleString('en-IN')}</Text>
      </View>

      <Text style={styles.reason}>{suggestion.reason}</Text>

      {isModifying ? (
        <View style={styles.modifyContainer}>
          <View style={styles.modifyInputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.modifyInput}
              value={modifiedAmount}
              onChangeText={setModifiedAmount}
              keyboardType="numeric"
              autoFocus
            />
          </View>
          <View style={styles.modifyButtons}>
            <TouchableOpacity style={styles.modifySaveButton} onPress={handleModify}>
              <Icon name="check" size={16} color="white" />
              <Text style={styles.modifySaveText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modifyCancelButton}
              onPress={() => {
                setIsModifying(false);
                setModifiedAmount(String(suggestion.suggestedAmount));
              }}
            >
              <Icon name="x" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.approveButton} onPress={onApprove}>
            <Icon name="check" size={16} color="white" />
            <Text style={styles.approveText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modifyButton}
            onPress={() => setIsModifying(true)}
          >
            <Icon name="edit-2" size={16} color="#007AFF" />
            <Text style={styles.modifyText}>Modify</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectButton} onPress={onReject}>
            <Icon name="x" size={16} color="#FF3B30" />
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E6EEF8',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flex: 1,
    gap: 6,
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '700',
  },
  jarLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  amount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#007AFF',
  },
  reason: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  approveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modifyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 6,
  },
  modifyText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '700',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF3B30',
    gap: 6,
  },
  rejectText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '700',
  },
  modifyContainer: {
    marginTop: 8,
  },
  modifyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6EEF8',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 6,
  },
  modifyInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    paddingVertical: 10,
  },
  modifyButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modifySaveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  modifySaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modifyCancelButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

