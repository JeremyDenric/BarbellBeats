/**
 * ForgotPasswordScreen
 *
 * Password reset request screen with:
 * - Email validation
 * - Password reset request
 * - Success/error feedback
 * - Glassmorphic design matching Login/Register
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { RootStackParamList } from '../../types';
import {
  ValidatedInput,
  LoadingOverlay,
  ValidationRule,
} from '../../components/auth';
import { COLORS, SPACING, RADIUS } from '../../theme/tokens';

type ForgotPasswordNavigation = NativeStackNavigationProp<RootStackParamList, 'Login'>;

// Email validation rules
const emailValidationRules: ValidationRule[] = [
  {
    test: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Invalid email format',
  },
];

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<ForgotPasswordNavigation>();
  const { requestPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleResetRequest = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!emailValid) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      await requestPasswordReset(email.trim());

      // Show success state
      setResetSent(true);

      // Show success alert
      Alert.alert(
        'Reset Email Sent',
        'Check your email for instructions to reset your password.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to send reset email';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <LinearGradient
        colors={['#0A0A0F', '#0F0F18', '#0A0A0F']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.content}>
                {/* Header Section */}
                <View style={styles.brandContainer}>
                  <LinearGradient
                    colors={['#CBFF00', '#9ECC00', '#DBFF4D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconCircle}
                  >
                    <Text style={styles.iconEmoji}>🔑</Text>
                  </LinearGradient>

                  <Text style={styles.title}>RESET PASSWORD</Text>
                  <Text style={styles.subtitle}>
                    {resetSent
                      ? 'Check your email for reset instructions'
                      : 'Enter your email to receive reset instructions'}
                  </Text>

                  {/* Accent bar */}
                  <LinearGradient
                    colors={['#CBFF00', '#DBFF4D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.accentBar}
                  />
                </View>

                {/* Form Section */}
                <View style={styles.formContainer}>
                  <View style={styles.glassCard}>
                    {!resetSent ? (
                      <>
                        <Text style={styles.formTitle}>FORGOT PASSWORD</Text>

                        <Text style={styles.instructions}>
                          Enter the email address associated with your account and we'll
                          send you a link to reset your password.
                        </Text>

                        {/* Email Input with Validation */}
                        <ValidatedInput
                          icon="📧"
                          placeholder="Email"
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          textContentType="emailAddress"
                          autoComplete="email"
                          validationRules={emailValidationRules}
                          onValidationChange={(isValid) => setEmailValid(isValid)}
                        />

                        {/* Reset Button */}
                        <TouchableOpacity
                          onPress={handleResetRequest}
                          disabled={loading}
                          activeOpacity={0.8}
                          style={styles.submitButtonContainer}
                        >
                          <LinearGradient
                            colors={['#CBFF00', '#4A7A00']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.button, loading && styles.buttonDisabled]}
                          >
                            <Text style={styles.buttonText}>
                              {loading ? 'SENDING...' : 'SEND RESET LINK'}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>

                        {/* Back to Login Link */}
                        <TouchableOpacity
                          style={styles.backButton}
                          onPress={() => navigation.navigate('Login')}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.backText}>← Back to Sign In</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <View style={styles.successContainer}>
                          <Text style={styles.successIcon}>✅</Text>
                          <Text style={styles.successTitle}>Email Sent!</Text>
                          <Text style={styles.successMessage}>
                            We've sent password reset instructions to{'\n'}
                            <Text style={styles.successEmail}>{email}</Text>
                          </Text>

                          <Text style={styles.successSubtext}>
                            Didn't receive the email? Check your spam folder or try
                            again.
                          </Text>

                          <TouchableOpacity
                            style={styles.resendButton}
                            onPress={handleResetRequest}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.resendText}>Resend Email</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.navigate('Login')}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.backText}>← Back to Sign In</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </View>
                </View>

                {/* Bottom Accent */}
                <View style={styles.bottomSection}>
                  <Text style={styles.bottomText}>SECURE RESET</Text>
                  <LinearGradient
                    colors={['#DBFF4D', '#CBFF00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.bottomBar}
                  />
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>

      {/* Loading Overlay */}
      <LoadingOverlay visible={loading} message="Sending reset email..." />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 40,
    minHeight: 700,
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#CBFF00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  iconEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 3,
    marginBottom: 8,
    textShadowColor: '#CBFF00',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 15,
    color: '#9B9BAD',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
  },
  accentBar: {
    width: 80,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 20,
  },
  glassCard: {
    backgroundColor: 'rgba(21, 21, 31, 0.8)',
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 3,
  },
  instructions: {
    fontSize: 14,
    color: '#9B9BAD',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  submitButtonContainer: {
    marginTop: 8,
  },
  button: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#CBFF00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  backButton: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  backText: {
    color: '#DBFF4D',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 1,
  },
  successMessage: {
    fontSize: 15,
    color: '#9B9BAD',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  successEmail: {
    color: '#CBFF00',
    fontWeight: '700',
  },
  successSubtext: {
    fontSize: 13,
    color: '#8B9482',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
    lineHeight: 18,
  },
  resendButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBFF00',
    marginBottom: 8,
  },
  resendText: {
    color: '#CBFF00',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bottomSection: {
    alignItems: 'center',
    marginBottom: 10,
  },
  bottomText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#9B9BAD',
    letterSpacing: 2,
    marginBottom: 8,
  },
  bottomBar: {
    width: 120,
    height: 3,
    borderRadius: 2,
  },
});
