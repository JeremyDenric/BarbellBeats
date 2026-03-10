import React, { useState } from "react";
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
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../contexts/AuthContext";
import { RootStackParamList } from "../../types";
import {
  ValidatedInput,
  PasswordInput,
  AppleSignInButton,
  GoogleSignInButton,
  AuthDivider,
  LoadingOverlay,
  ValidationRule,
  PasswordStrengthResult,
} from "../../components/auth";
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from "../../theme/tokens";

type RegisterNavigation = NativeStackNavigationProp<RootStackParamList, "Register">;

// Validation rules
const nameValidationRules: ValidationRule[] = [
  {
    test: (value: string) => value.trim().length >= 2,
    message: 'Name must be at least 2 characters',
  },
];

const emailValidationRules: ValidationRule[] = [
  {
    test: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Invalid email format',
  },
];

const passwordValidationRules: ValidationRule[] = [
  {
    test: (value: string) => value.length >= 8,
    message: 'Password must be at least 8 characters',
  },
];

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterNavigation>();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Creating account...');

  const [nameValid, setNameValid] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrengthResult | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(0);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    // Clear confirm password error when password changes
    if (confirmPassword && value !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    // Check if passwords match
    if (password && value && password !== value) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleSubmit = async () => {
    // Rate limit check
    if (Date.now() < lockoutUntil) {
      const secondsRemaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      Alert.alert('Too many attempts', `Please wait ${secondsRemaining} seconds before trying again.`);
      return;
    }

    // Validation
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert("Missing details", "Please fill in all fields.");
      return;
    }

    if (!nameValid) {
      Alert.alert("Invalid name", "Please enter a valid name.");
      return;
    }

    if (!emailValid) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    if (!passwordValid || password.length < 8) {
      Alert.alert("Weak password", "Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }

    // Check password strength
    if (passwordStrength && passwordStrength.strength === 'weak') {
      Alert.alert(
        "Weak password",
        "Your password is weak. Consider using a stronger password with uppercase, lowercase, numbers, and special characters.",
        [
          { text: "Use anyway", onPress: () => performRegistration() },
          { text: "Cancel", style: "cancel" }
        ]
      );
      return;
    }

    await performRegistration();
  };

  const performRegistration = async () => {
    try {
      setLoading(true);
      setLoadingMessage('Creating your account...');
      await register(email.trim(), password, name.trim());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      Alert.alert("Registration failed", errorMessage);

      // Increment attempts on failure
      setAttempts(prev => {
        const newAttempts = prev + 1;
        if (newAttempts >= 5) {
          setLockoutUntil(Date.now() + 60000);
          return 0;
        }
        return newAttempts;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSuccess = () => {
    // Social registration successful
    // Navigation will be handled by auth state change
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
            behavior={Platform.OS === "ios" ? "padding" : "height"}
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
                    style={styles.logoCircle}
                  >
                    <Text style={styles.logoEmoji}>🏋️</Text>
                  </LinearGradient>

                  <Text style={styles.title}>JOIN BARBELLBEATS</Text>
                  <Text style={styles.subtitle}>Your fitness journey starts here</Text>

                  {/* Accent bar */}
                  <LinearGradient
                    colors={['#CBFF00', '#DBFF4D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.accentBar}
                  />
                </View>

                {/* Form Section with Glassmorphism */}
                <View style={styles.formContainer}>
                  <View style={styles.glassCard}>
                    <Text style={styles.formTitle}>CREATE ACCOUNT</Text>

                    {/* Name Input with Validation */}
                    <ValidatedInput
                      icon="👤"
                      placeholder="Full Name"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      textContentType="name"
                      autoComplete="name"
                      validationRules={nameValidationRules}
                      onValidationChange={(isValid) => setNameValid(isValid)}
                    />

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

                    {/* Password Input with Strength Indicator */}
                    <PasswordInput
                      icon="🔒"
                      placeholder="Password"
                      value={password}
                      onChangeText={handlePasswordChange}
                      showStrengthIndicator
                      onStrengthChange={setPasswordStrength}
                      validationRules={passwordValidationRules}
                      onValidationChange={(isValid) => setPasswordValid(isValid)}
                    />

                    {/* Confirm Password Input */}
                    <PasswordInput
                      icon="🔒"
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChangeText={handleConfirmPasswordChange}
                      error={confirmPasswordError}
                    />

                    {/* Register Button */}
                    <TouchableOpacity
                      onPress={handleSubmit}
                      disabled={loading}
                      activeOpacity={0.8}
                      style={styles.submitButtonContainer}
                      accessibilityRole="button"
                      accessibilityLabel={loading ? 'Creating account' : 'Create account'}
                      accessibilityState={{ disabled: loading, busy: loading }}
                    >
                      <LinearGradient
                        colors={['#CBFF00', '#4A7A00']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.button, loading && styles.buttonDisabled]}
                      >
                        <Text style={styles.buttonText}>
                          {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT 💪'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Social Registration Section */}
                    <AuthDivider />

                    <AppleSignInButton onSuccess={handleSocialSuccess} />
                    <GoogleSignInButton onSuccess={handleSocialSuccess} />

                    {/* Login Link */}
                    <TouchableOpacity
                      style={styles.loginLink}
                      onPress={() => navigation.navigate("Login")}
                      activeOpacity={0.7}
                      accessibilityRole="link"
                      accessibilityLabel="Sign in to existing account"
                    >
                      <Text style={styles.loginText}>
                        Already have an account? <Text style={styles.loginTextBold}>Sign in</Text>
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Bottom Accent */}
                <View style={styles.bottomSection}>
                  <Text style={styles.bottomText}>
                    JOIN THE MOVEMENT
                  </Text>
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
      <LoadingOverlay visible={loading} message={loadingMessage} />
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
    minHeight: 800,
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoCircle: {
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
  logoEmoji: {
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
    fontSize: 16,
    color: '#9B9BAD',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
    letterSpacing: 1,
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
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 3,
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
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  loginText: {
    color: '#9B9BAD',
    fontSize: 13,
  },
  loginTextBold: {
    color: '#DBFF4D',
    fontWeight: '700',
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
