import { Feather as Icon } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CoachTabProps {
  currentUser: any;
  onOpenChat: () => void;
}

export default function CoachTab({ currentUser, onOpenChat }: CoachTabProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Financial Coach</Text>
        <Text style={styles.subtitle}>Get personalized financial advice</Text>
      </View>
      
      <View style={styles.card}>
        <TouchableOpacity 
          style={styles.chatButton}
          onPress={onOpenChat}
        >
          <Icon name="message-circle" size={24} color="white" style={styles.chatIcon} />
          <Text style={styles.chatButtonText}>Chat with Financial Coach</Text>
        </TouchableOpacity>
        
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Quick Tips</Text>
          
          <View style={styles.tipItem}>
            <View style={[styles.tipIcon, { backgroundColor: '#E8F5E9' }]}>
              <Icon name="trending-up" size={20} color="#4CAF50" />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Save Consistently</Text>
              <Text style={styles.tipDescription}>Aim to save at least 20% of your income each month.</Text>
            </View>
          </View>
          
          <View style={styles.tipItem}>
            <View style={[styles.tipIcon, { backgroundColor: '#FFF3E0' }]}>
              <Icon name="alert-triangle" size={20} color="#FFA000" />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Manage Debt</Text>
              <Text style={styles.tipDescription}>Focus on paying off high-interest debt as a priority.</Text>
            </View>
          </View>
          
          <View style={styles.tipItem}>
            <View style={[styles.tipIcon, { backgroundColor: '#E3F2FD' }]}>
              <Icon name="bar-chart-2" size={20} color="#2196F3" />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Diversify Investments</Text>
              <Text style={styles.tipDescription}>Spread your investments across different asset classes.</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chatButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  chatIcon: {
    marginRight: 12,
  },
  chatButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsContainer: {
    marginTop: 8,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
