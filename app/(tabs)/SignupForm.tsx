import { Feather as Icon } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AIStudioTheme } from '../../constants/aiStudioTheme';
import SpiritAnimalOnboarding from '../../screens/SpiritAnimalOnboarding';
import { SpiritAnimalType } from '../../types/spiritAnimal';

interface SignupFormData {
  name: string;
  email: string;
  password: string;
  age: string;
  phone: string;
  city: string;
  occupation: string;
  monthlyIncome: string;
  maritalStatus: 'single' | 'married';
  dependents: string;
  primaryGoal: 'emergency' | 'education' | 'home' | 'vacation' | 'retirement' | 'wealth';
  investmentExperience: 'none' | 'basic' | 'experienced';
  spiritAnimal?: string;
}

interface SignupFormProps {
  onSubmit: (data: SignupFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function SignupForm({ onSubmit, onCancel, loading }: SignupFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    password: '',
    age: '',
    phone: '',
    city: '',
    occupation: '',
    monthlyIncome: '',
    maritalStatus: 'single',
    dependents: '0',
    primaryGoal: 'wealth',
    investmentExperience: 'basic',
  });

  const updateField = (field: keyof SignupFormData, value: string | 'single' | 'married' | 'emergency' | 'education' | 'home' | 'vacation' | 'retirement' | 'wealth' | 'none' | 'basic' | 'experienced') => {
    setFormData({ ...formData, [field]: value });
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getPasswordStrength = (password: string): { strength: 'weak' | 'medium' | 'strong'; color: string; text: string } => {
    if (password.length < 6) return { strength: 'weak', color: AIStudioTheme.colors.error, text: 'Too short' };
    if (password.length < 8) return { strength: 'medium', color: AIStudioTheme.colors.warning, text: 'Medium' };
    if (password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 'strong', color: AIStudioTheme.colors.success, text: 'Strong' };
    }
    return { strength: 'medium', color: AIStudioTheme.colors.warning, text: 'Medium' };
  };

  const validateStep = (stepNum: number): boolean => {
    if (stepNum === 1) {
      if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
        Alert.alert('Error', 'Please fill all required fields');
        return false;
      }
      if (formData.name.trim().length < 2) {
        Alert.alert('Error', 'Name must be at least 2 characters');
        return false;
      }
      if (!validateEmail(formData.email.trim())) {
        Alert.alert('Error', 'Please enter a valid email address');
        return false;
      }
      if (formData.password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return false;
      }
    }
    if (stepNum === 2) {
      if (!formData.age || !formData.phone || !formData.city || !formData.occupation) {
        Alert.alert('Error', 'Please fill all fields');
        return false;
      }
      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
        Alert.alert('Error', 'Please enter a valid age (13-120)');
        return false;
      }
      if (formData.phone.trim().length < 10) {
        Alert.alert('Error', 'Please enter a valid phone number');
        return false;
      }
    }
    if (stepNum === 3) {
      if (!formData.monthlyIncome) {
        Alert.alert('Error', 'Please enter your monthly income');
        return false;
      }
      const incomeNum = parseFloat(formData.monthlyIncome);
      if (isNaN(incomeNum) || incomeNum < 0) {
        Alert.alert('Error', 'Please enter a valid monthly income');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 4) {
        setStep(step + 1);
      } else {
        onSubmit(formData);
      }
    }
  };

  const handleSpiritAnimalComplete = (animalType: SpiritAnimalType) => {
    const updatedFormData = { ...formData, spiritAnimal: animalType };
    setFormData(updatedFormData);
    // Auto-submit after quiz completion with the updated data
    setTimeout(() => {
      onSubmit(updatedFormData);
    }, 500);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: AIStudioTheme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={step === 4 ? styles.scrollContentFullScreen : styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step < 4 && (
          <>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
            </View>
            <Text style={styles.stepIndicator}>Step {step} of 4</Text>
          </>
        )}

        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Let's get started with your basic information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={AIStudioTheme.colors.textMuted}
                value={formData.name}
                onChangeText={(v) => updateField('name', v)}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={[
                  styles.input,
                  formData.email && !validateEmail(formData.email) && styles.inputError
                ]}
                placeholder="your.email@example.com"
                placeholderTextColor={AIStudioTheme.colors.textMuted}
                value={formData.email}
                onChangeText={(v) => updateField('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {formData.email && !validateEmail(formData.email) && (
                <Text style={styles.errorText}>Please enter a valid email address</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Minimum 6 characters"
                placeholderTextColor={AIStudioTheme.colors.textMuted}
                value={formData.password}
                onChangeText={(v) => updateField('password', v)}
                secureTextEntry
              />
              {formData.password.length > 0 && (
                <View style={styles.passwordStrengthContainer}>
                  <View style={styles.passwordStrengthBar}>
                    <View
                      style={[
                        styles.passwordStrengthFill,
                        {
                          width: `${(formData.password.length / 12) * 100}%`,
                          backgroundColor: getPasswordStrength(formData.password).color
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.passwordStrengthText, { color: getPasswordStrength(formData.password).color }]}>
                    {getPasswordStrength(formData.password).text}
                  </Text>
                </View>
              )}
              <Text style={styles.hintText}>Use 8+ characters with mix of letters and numbers for better security</Text>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Personal Details</Text>
            <Text style={styles.subtitle}>Help us understand you better</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your age"
                placeholderTextColor={AIStudioTheme.colors.textMuted}
                value={formData.age}
                onChangeText={(v) => updateField('age', v)}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 9876543210"
                placeholderTextColor={AIStudioTheme.colors.textMuted}
                value={formData.phone}
                onChangeText={(v) => updateField('phone', v)}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                placeholder="Your city"
                placeholderTextColor={AIStudioTheme.colors.textMuted}
                value={formData.city}
                onChangeText={(v) => updateField('city', v)}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Occupation *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Delivery Partner, Student, etc."
                placeholderTextColor={AIStudioTheme.colors.textMuted}
                value={formData.occupation}
                onChangeText={(v) => updateField('occupation', v)}
              />
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Financial Profile</Text>
            <Text style={styles.subtitle}>This helps us personalize your experience</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Monthly Income (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter approximate monthly income"
                placeholderTextColor={AIStudioTheme.colors.textMuted}
                value={formData.monthlyIncome}
                onChangeText={(v) => updateField('monthlyIncome', v)}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Marital Status</Text>
              <View style={styles.optionRow}>
                {(['single', 'married'] as const).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.optionButton,
                      formData.maritalStatus === status && styles.optionButtonActive,
                    ]}
                    onPress={() => updateField('maritalStatus', status)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        formData.maritalStatus === status && styles.optionTextActive,
                      ]}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Number of Dependents</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={AIStudioTheme.colors.textMuted}
                value={formData.dependents}
                onChangeText={(v) => updateField('dependents', v)}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Primary Financial Goal</Text>
              <View style={styles.goalGrid}>
                {(['emergency', 'education', 'home', 'vacation', 'retirement', 'wealth'] as const).map((goal) => (
                  <TouchableOpacity
                    key={goal}
                    style={[
                      styles.goalButton,
                      formData.primaryGoal === goal && styles.goalButtonActive,
                    ]}
                    onPress={() => updateField('primaryGoal', goal)}
                  >
                    <Text
                      style={[
                        styles.goalText,
                        formData.primaryGoal === goal && styles.goalTextActive,
                      ]}
                    >
                      {goal.charAt(0).toUpperCase() + goal.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Investment Experience</Text>
              <View style={styles.optionRow}>
                {(['none', 'basic', 'experienced'] as const).map((exp) => (
                  <TouchableOpacity
                    key={exp}
                    style={[
                      styles.optionButton,
                      formData.investmentExperience === exp && styles.optionButtonActive,
                    ]}
                    onPress={() => updateField('investmentExperience', exp)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        formData.investmentExperience === exp && styles.optionTextActive,
                      ]}
                    >
                      {exp.charAt(0).toUpperCase() + exp.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {step === 4 && (
          <SpiritAnimalOnboarding onComplete={handleSpiritAnimalComplete} />
        )}

        {step < 4 && (
          <View style={styles.buttonRow}>
            {step > 1 && (
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(step - 1)}>
                <Icon name="arrow-left" size={18} color={AIStudioTheme.colors.primary} />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.nextButton, loading && styles.nextButtonDisabled]}
              onPress={handleNext}
              disabled={loading}
            >
              <Text style={styles.nextButtonText}>
                {step === 3 ? 'Next' : 'Next'}
              </Text>
              {step < 3 && <Icon name="arrow-right" size={18} color="white" style={{ marginLeft: 6 }} />}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AIStudioTheme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    flexGrow: 1,
  },
  scrollContentFullScreen: {
    flexGrow: 1,
  },
  progressBar: {
    height: 3,
    backgroundColor: AIStudioTheme.colors.surfaceVariant,
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: AIStudioTheme.colors.primary,
    borderRadius: 2,
  },
  stepIndicator: {
    color: AIStudioTheme.colors.textSecondary,
    fontSize: 11,
    marginBottom: 16,
  },
  stepContent: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: AIStudioTheme.colors.text,
    marginBottom: 6,
  },
  subtitle: {
    color: AIStudioTheme.colors.textSecondary,
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: AIStudioTheme.colors.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: AIStudioTheme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: AIStudioTheme.colors.surface,
    color: AIStudioTheme.colors.text,
    minHeight: 44,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: AIStudioTheme.colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    backgroundColor: AIStudioTheme.colors.surface,
    minHeight: 44,
    justifyContent: 'center',
  },
  optionButtonActive: {
    borderColor: AIStudioTheme.colors.primary,
    backgroundColor: AIStudioTheme.colors.surfaceVariant,
  },
  optionText: {
    color: AIStudioTheme.colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  optionTextActive: {
    color: AIStudioTheme.colors.primary,
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AIStudioTheme.colors.border,
    backgroundColor: AIStudioTheme.colors.surface,
    minHeight: 36,
    justifyContent: 'center',
  },
  goalButtonActive: {
    borderColor: AIStudioTheme.colors.primary,
    backgroundColor: AIStudioTheme.colors.surfaceVariant,
  },
  goalText: {
    color: AIStudioTheme.colors.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
  goalTextActive: {
    color: AIStudioTheme.colors.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    marginTop: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AIStudioTheme.colors.primary,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  backButtonText: {
    color: AIStudioTheme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  nextButton: {
    flex: 2,
    backgroundColor: AIStudioTheme.colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: AIStudioTheme.colors.textInverse,
    fontWeight: '700',
    fontSize: 15,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 20,
  },
  cancelButtonText: {
    color: AIStudioTheme.colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  inputError: {
    borderColor: AIStudioTheme.colors.error,
  },
  errorText: {
    color: AIStudioTheme.colors.error,
    fontSize: 11,
    marginTop: 3,
  },
  passwordStrengthContainer: {
    marginTop: 6,
  },
  passwordStrengthBar: {
    height: 3,
    backgroundColor: AIStudioTheme.colors.surfaceVariant,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 3,
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: 11,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 11,
    color: AIStudioTheme.colors.textMuted,
    marginTop: 3,
    lineHeight: 15,
  },
});
