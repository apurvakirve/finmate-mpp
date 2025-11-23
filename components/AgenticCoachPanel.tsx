import { Feather as Icon } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { AIAllocationSuggestion, AIInsight, LearningProfile } from '../types/agenticCoach';
import AIAllocationCard from './AIAllocationCard';

interface AgenticCoachPanelProps {
  suggestions: AIAllocationSuggestion[];
  insights: AIInsight[];
  loading: boolean;
  learningProfile: LearningProfile;
  onApproveSuggestion: (suggestion: AIAllocationSuggestion) => void;
  onRejectSuggestion: (suggestion: AIAllocationSuggestion) => void;
  onModifySuggestion: (suggestion: AIAllocationSuggestion, actualAmount: number) => void;
  onApplyAll: () => void;
  onRefresh: () => void;
  onAskQuestion: (question: string) => Promise<string>;
}

export default function AgenticCoachPanel({
  suggestions,
  insights,
  loading,
  learningProfile,
  onApproveSuggestion,
  onRejectSuggestion,
  onModifySuggestion,
  onApplyAll,
  onRefresh,
  onAskQuestion,
}: AgenticCoachPanelProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    setAsking(true);
    try {
      const response = await onAskQuestion(question);
      setAnswer(response);
    } catch (error) {
      console.error('Error asking question:', error);
      setAnswer('Sorry, I encountered an error. Please try again.');
    } finally {
      setAsking(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="zap" size={20} color="#007AFF" />
          <Text style={styles.headerTitle}>AI Financial Coach</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} disabled={loading}>
          <Icon name="refresh-cw" size={18} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Analyzing your finances...</Text>
        </View>
      )}

      {insights.length > 0 && (
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>Insights</Text>
          {insights.map((insight, index) => (
            <View key={index} style={styles.insightCard}>
              <Icon
                name={
                  insight.type === 'warning'
                    ? 'alert-triangle'
                    : insight.type === 'kudos'
                    ? 'check-circle'
                    : insight.type === 'action'
                    ? 'zap'
                    : 'info'
                }
                size={16}
                color={
                  insight.type === 'warning'
                    ? '#FF9500'
                    : insight.type === 'kudos'
                    ? '#34C759'
                    : insight.type === 'action'
                    ? '#007AFF'
                    : '#6B7280'
                }
              />
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightMessage}>{insight.message}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {suggestions.length > 0 && (
        <View style={styles.suggestionsSection}>
          <View style={styles.suggestionsHeader}>
            <Text style={styles.sectionTitle}>Allocation Suggestions</Text>
            {suggestions.length > 1 && (
              <TouchableOpacity style={styles.applyAllButton} onPress={onApplyAll}>
                <Text style={styles.applyAllText}>Apply All</Text>
              </TouchableOpacity>
            )}
          </View>
          {suggestions.map((suggestion, index) => (
            <AIAllocationCard
              key={index}
              suggestion={suggestion}
              onApprove={() => onApproveSuggestion(suggestion)}
              onReject={() => onRejectSuggestion(suggestion)}
              onModify={(amount) => onModifySuggestion(suggestion, amount)}
            />
          ))}
        </View>
      )}

      {suggestions.length === 0 && insights.length === 0 && !loading && (
        <View style={styles.emptyContainer}>
          <Icon name="info" size={32} color="#9CA3AF" />
          <Text style={styles.emptyText}>No suggestions at the moment</Text>
          <Text style={styles.emptySubtext}>The AI coach will provide insights as you use the app</Text>
        </View>
      )}

      <View style={styles.questionSection}>
        <Text style={styles.sectionTitle}>Ask a Question</Text>
        <View style={styles.questionInputContainer}>
          <TextInput
            style={styles.questionInput}
            placeholder="Ask about your allocations..."
            value={question}
            onChangeText={setQuestion}
            multiline
          />
          <TouchableOpacity
            style={[styles.askButton, asking && styles.askButtonDisabled]}
            onPress={handleAskQuestion}
            disabled={asking || !question.trim()}
          >
            {asking ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Icon name="send" size={16} color="white" />
            )}
          </TouchableOpacity>
        </View>
        {answer && (
          <View style={styles.answerCard}>
            <Text style={styles.answerText}>{answer}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
  },
  insightsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  insightMessage: {
    fontSize: 13,
    color: '#6B7280',
  },
  suggestionsSection: {
    marginBottom: 20,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  applyAllButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  applyAllText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  questionSection: {
    marginTop: 8,
  },
  questionInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  questionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E6EEF8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 44,
  },
  askButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
  },
  askButtonDisabled: {
    opacity: 0.5,
  },
  answerCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  answerText: {
    fontSize: 14,
    color: '#0F172A',
    lineHeight: 20,
  },
});

