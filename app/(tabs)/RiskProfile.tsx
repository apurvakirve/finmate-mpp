import { Feather as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export type RiskLevel = 'conservative' | 'moderate' | 'aggressive';

interface RiskProfileData {
  maritalStatus: 'single' | 'married';
  dependents: number;
  primaryGoal: 'emergency' | 'education' | 'home' | 'vacation' | 'retirement' | 'wealth';
  incomeStability: 'stable' | 'variable' | 'highly-variable';
  investmentExperience: 'none' | 'basic' | 'experienced';
  emergencyFundMonths: number;
  age: number;
  insuranceCover: 'none' | 'partial' | 'full';
  monthlyIncome: number;
  monthlyEMI: number;
}

const defaultProfile: RiskProfileData = {
  maritalStatus: 'single',
  dependents: 0,
  primaryGoal: 'wealth',
  incomeStability: 'variable',
  investmentExperience: 'basic',
  emergencyFundMonths: 1,
  age: 25,
  insuranceCover: 'partial',
  monthlyIncome: 50000,
  monthlyEMI: 0,
};

interface RiskProfileProps {
  userId: string | number;
  onRiskLevelChange?: (risk: RiskLevel) => void;
  variant?: 'card' | 'summary';
}

export const riskProfileStorageKey = (userId: string | number) => `mt_risk_profile_${userId}`;

export function computeRiskScore(profile: RiskProfileData): { score: number; level: RiskLevel } {
  let score = 50;
  // Age
  if (profile.age < 30) score += 10; else if (profile.age > 45) score -= 10;
  // Marital + dependents
  if (profile.maritalStatus === 'married') score -= 5;
  score -= Math.min(profile.dependents, 4) * 3;
  // Income stability
  if (profile.incomeStability === 'stable') score += 5;
  if (profile.incomeStability === 'highly-variable') score -= 10;
  // Emergency fund
  if (profile.emergencyFundMonths >= 6) score += 10;
  else if (profile.emergencyFundMonths <= 1) score -= 10;
  // Investment experience
  if (profile.investmentExperience === 'experienced') score += 10;
  if (profile.investmentExperience === 'none') score -= 10;
  // Insurance cover
  if (profile.insuranceCover === 'none') score -= 5;
  if (profile.insuranceCover === 'full') score += 5;
  // Goal
  if (profile.primaryGoal === 'emergency' || profile.primaryGoal === 'home') score -= 5;
  if (profile.primaryGoal === 'wealth' || profile.primaryGoal === 'retirement') score += 5;

  const clamped = Math.min(100, Math.max(0, score));
  let level: RiskLevel = 'moderate';
  if (clamped < 45) level = 'conservative';
  else if (clamped > 65) level = 'aggressive';
  return { score: clamped, level };
}

export default function RiskProfile({ userId, onRiskLevelChange, variant = 'card' }: RiskProfileProps) {
  const [profile, setProfile] = useState<RiskProfileData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [draft, setDraft] = useState<RiskProfileData>(defaultProfile);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(riskProfileStorageKey(userId));
        if (raw) {
          const stored = JSON.parse(raw);
          setProfile(stored);
          setDraft(stored);
        }
      } catch { }
    })();
  }, [userId]);

  useEffect(() => {
    if (profile && onRiskLevelChange) {
      onRiskLevelChange(computeRiskScore(profile).level);
    }
  }, [profile, onRiskLevelChange]);

  const saveProfile = async () => {
    if (!userId) return;
    setProfile(draft);
    await AsyncStorage.setItem(riskProfileStorageKey(userId), JSON.stringify(draft));
    setShowModal(false);
  };

  const risk = useMemo(() => profile ? computeRiskScore(profile) : computeRiskScore(defaultProfile), [profile]);

  const renderPill = (label: string, active: boolean) => (
    <View style={[styles.pill, active && styles.pillActive]}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </View>
  );

  if (variant === 'summary') {
    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryHeaderRow}>
          <View>
            <Text style={styles.title}>Risk Level</Text>
            <Text style={styles.subtitle}>We see you as {risk.level.toUpperCase()}</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={() => setShowModal(true)}>
            <Icon name={profile ? 'edit-2' : 'plus'} size={16} color="#007AFF" />
            <Text style={styles.editButtonText}>Adjust</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.meterContainer}>
          <Text style={styles.meterLabel}>Score {risk.score.toFixed(0)}</Text>
          <View style={styles.track}>
            <View style={[styles.fill, {
              width: `${risk.score}%`,
              backgroundColor: risk.level === 'aggressive' ? '#FF3B30' : risk.level === 'moderate' ? '#FF9500' : '#34C759'
            }]} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Personal Risk Profile</Text>
          <Text style={styles.subtitle}>{profile ? 'Tailored recommendations enabled' : 'Answer a few questions to personalize coaching.'}</Text>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={() => setShowModal(true)}>
          <Icon name={profile ? 'edit' : 'plus'} size={16} color="#007AFF" />
          <Text style={styles.editButtonText}>{profile ? 'Update' : 'Start'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.meterContainer}>
        <Text style={styles.meterLabel}>Risk Score</Text>
        <Text style={[styles.meterScore, risk.level === 'aggressive' ? styles.aggressive : risk.level === 'conservative' ? styles.conservative : styles.moderate]}>
          {risk.score.toFixed(0)} / 100 ({risk.level.toUpperCase()})
        </Text>
        <View style={styles.track}>
          <View style={[styles.fill, {
            width: `${risk.score}%`,
            backgroundColor: risk.level === 'aggressive' ? '#FF3B30' : risk.level === 'moderate' ? '#FF9500' : '#34C759'
          }]} />
        </View>
      </View>

      {profile && (
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>Marital</Text>
            {renderPill(profile.maritalStatus === 'married' ? 'Married' : 'Single', true)}
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>Dependents</Text>
            {renderPill(`${profile.dependents}`, true)}
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>Goal</Text>
            {renderPill(profile.primaryGoal, true)}
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>Income</Text>
            {renderPill(profile.incomeStability, true)}
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>Emergency Fund</Text>
            {renderPill(`${profile.emergencyFundMonths} months`, true)}
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>Experience</Text>
            {renderPill(profile.investmentExperience, true)}
          </View>
        </View>
      )}

      <Modal visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Personalize Insights</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Icon name="x" size={22} color="#000" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ paddingHorizontal: 20 }}>
            <Text style={styles.questionLabel}>Marital Status</Text>
            <View style={styles.optionRow}>
              {['single', 'married'].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.optionButton, draft.maritalStatus === value && styles.optionButtonActive]}
                  onPress={() => setDraft({ ...draft, maritalStatus: value as RiskProfileData['maritalStatus'] })}
                >
                  <Text style={[styles.optionText, draft.maritalStatus === value && styles.optionTextActive]}>{value}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.questionLabel}>Dependents relying on you</Text>
            <TextInput
              keyboardType="numeric"
              value={String(draft.dependents)}
              onChangeText={(v) => setDraft({ ...draft, dependents: Math.max(0, parseInt(v || '0', 10)) })}
              style={styles.input}
            />

            <Text style={styles.questionLabel}>Primary Financial Goal</Text>
            <View style={styles.optionWrap}>
              {['emergency', 'education', 'home', 'vacation', 'retirement', 'wealth'].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.optionButtonWide, draft.primaryGoal === value && styles.optionButtonActive]}
                  onPress={() => setDraft({ ...draft, primaryGoal: value as RiskProfileData['primaryGoal'] })}
                >
                  <Text style={[styles.optionText, draft.primaryGoal === value && styles.optionTextActive]}>{value}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.questionLabel}>Income Stability</Text>
            <View style={styles.optionRow}>
              {[
                { value: 'stable', label: 'Stable' },
                { value: 'variable', label: 'Variable' },
                { value: 'highly-variable', label: 'Highly Variable' }
              ].map(({ value, label }) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.optionButtonWide, draft.incomeStability === value && styles.optionButtonActive]}
                  onPress={() => setDraft({ ...draft, incomeStability: value as RiskProfileData['incomeStability'] })}
                >
                  <Text style={[styles.optionText, draft.incomeStability === value && styles.optionTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.questionLabel}>Investment Experience</Text>
            <View style={styles.optionRow}>
              {['none', 'basic', 'experienced'].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.optionButtonWide, draft.investmentExperience === value && styles.optionButtonActive]}
                  onPress={() => setDraft({ ...draft, investmentExperience: value as RiskProfileData['investmentExperience'] })}
                >
                  <Text style={[styles.optionText, draft.investmentExperience === value && styles.optionTextActive]}>{value}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.questionLabel}>Emergency Fund Cover (months of expenses saved)</Text>
            <TextInput
              keyboardType="numeric"
              value={String(draft.emergencyFundMonths)}
              onChangeText={(v) => setDraft({ ...draft, emergencyFundMonths: Math.max(0, parseInt(v || '0', 10)) })}
              style={styles.input}
            />

            <Text style={styles.questionLabel}>Age</Text>
            <TextInput
              keyboardType="numeric"
              value={String(draft.age)}
              onChangeText={(v) => setDraft({ ...draft, age: Math.max(18, parseInt(v || '18', 10)) })}
              style={styles.input}
            />

            <Text style={styles.questionLabel}>Insurance Coverage</Text>
            <View style={styles.optionRow}>
              {['none', 'partial', 'full'].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.optionButton, draft.insuranceCover === value && styles.optionButtonActive]}
                  onPress={() => setDraft({ ...draft, insuranceCover: value as RiskProfileData['insuranceCover'] })}
                >
                  <Text style={[styles.optionText, draft.insuranceCover === value && styles.optionTextActive]}>{value}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.questionLabel}>Monthly Income (₹)</Text>
            <TextInput
              keyboardType="numeric"
              value={String(draft.monthlyIncome)}
              onChangeText={(v) => setDraft({ ...draft, monthlyIncome: Math.max(0, parseInt(v || '0', 10)) })}
              style={styles.input}
              placeholder="e.g., 50000"
            />

            <Text style={styles.questionLabel}>Monthly EMI/Loan Payments (₹)</Text>
            <TextInput
              keyboardType="numeric"
              value={String(draft.monthlyEMI)}
              onChangeText={(v) => setDraft({ ...draft, monthlyEMI: Math.max(0, parseInt(v || '0', 10)) })}
              style={styles.input}
              placeholder="e.g., 15000"
            />

            <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
              <Text style={styles.saveButtonText}>Save Profile</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryContainer: {
    backgroundColor: '#f2f2f7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  subtitle: {
    marginTop: 4,
    color: '#6c6c70',
    fontSize: 13,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButtonText: {
    color: '#007AFF',
    marginLeft: 6,
    fontWeight: '600',
  },
  meterContainer: {
    marginTop: 16,
  },
  meterLabel: {
    color: '#6c6c70',
    fontSize: 12,
  },
  meterScore: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  conservative: { color: '#34C759' },
  moderate: { color: '#FF9500' },
  aggressive: { color: '#FF3B30' },
  track: {
    height: 10,
    backgroundColor: '#E5E5EA',
    borderRadius: 6,
    marginTop: 8,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  summaryCell: {
    width: '50%',
    marginBottom: 12,
  },
  summaryLabel: {
    color: '#6c6c70',
    fontSize: 12,
    marginBottom: 4,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f2f2f7',
    alignSelf: 'flex-start',
  },
  pillActive: {
    backgroundColor: '#e3f2fd',
  },
  pillText: {
    fontSize: 13,
    color: '#6c6c70',
  },
  pillTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  questionLabel: {
    marginTop: 18,
    marginBottom: 8,
    color: '#1c1c1e',
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#d1d1d6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: 'white',
  },
  optionButtonWide: {
    borderWidth: 1,
    borderColor: '#d1d1d6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: 'white',
  },
  optionButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
  optionText: {
    color: '#6c6c70',
    textTransform: 'capitalize',
  },
  optionTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d1d6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  saveButton: {
    marginVertical: 30,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '700',
  },
});


