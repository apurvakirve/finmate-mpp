import { Feather as Icon } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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
    if (password.length < 6) return { strength: 'weak', color: '#FF3B30', text: 'Too short' };
    if (password.length < 8) return { strength: 'medium', color: '#FF9500', text: 'Medium' };
    if (password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 'strong', color: '#34C759', text: 'Strong' };
    }
    return { strength: 'medium', color: '#FF9500', text: 'Medium' };
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
      </View>
      <Text style={styles.stepIndicator}>Step {step} of 4{step === 4 ? ' - Quiz (7 questions)' : ''}</Text>

      {step === 1 && (
        <View style={styles.stepContent}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Let's get started with your basic information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
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
        <View style={styles.stepContent}>
          <Text style={styles.title}>Discover Your Financial Personality</Text>
          <Text style={styles.subtitle}>Take a quick quiz to personalize your experience</Text>

          <SpiritAnimalOnboarding onComplete={handleSpiritAnimalComplete} />
        </View>
      )}

      {step < 4 && (
        <View style={styles.buttonRow}>
          {step > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={() => setStep(step - 1)}>
              <Icon name="arrow-left" size={18} color="#007AFF" />
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e5ea',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  stepIndicator: {
    color: '#6c6c70',
    fontSize: 12,
    marginBottom: 20,
  },
  stepContent: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 8,
  },
  subtitle: {
    color: '#6c6c70',
    fontSize: 14,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d1d6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d1d6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  optionButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#e6f0ff',
  },
  optionText: {
    color: '#6c6c70',
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#007AFF',
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  goalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d1d6',
    backgroundColor: 'white',
  },
  goalButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#e6f0ff',
  },
  goalText: {
    color: '#6c6c70',
    fontWeight: '600',
    fontSize: 13,
  },
  goalTextActive: {
    color: '#007AFF',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    flex: 1,
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 6,
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#6c6c70',
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  passwordStrengthContainer: {
    marginTop: 8,
  },
  passwordStrengthBar: {
    height: 4,
    backgroundColor: '#e5e5ea',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 4,
  },
});

