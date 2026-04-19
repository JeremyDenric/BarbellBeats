import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { mediumTap } from '../utils/haptics';
import devLog from '../utils/devLog';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import {
  ValidatedInput,
  PasswordInput,
  BiometricPrompt,
  AppleSignInButton,
  GoogleSignInButton,
  AuthDivider,
  LoadingOverlay,
} from '../components/auth';
import { useFormValidation } from '../hooks/useFormValidation';
import { validateEmail, validatePassword } from '../utils/validation';

export default function LoginScreen() {
  const { login, biometricAvailable, biometricEnabled } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Logging in...');
  const [showBiometric, setShowBiometric] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(0);

  const form = useFormValidation(
    { email: '', password: '' },
    { email: validateEmail, password: validatePassword }
  );

  const handleLogin = async () => {
    mediumTap();

    // Rate limit check
    if (Date.now() < lockoutUntil) {
      const secondsRemaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      Alert.alert('Too many attempts', `Please wait ${secondsRemaining} seconds before trying again.`);
      return;
    }

    if (!form.validate()) {
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage('Logging in...');
      await login(form.values.email, form.values.password);
    } catch (error) {
      devLog.warn('[LoginScreen] Login error:', error);

      // Server-side rate limit: use Retry-After from server instead of local counter
      if (error instanceof Error && error.name === 'RateLimitError') {
        const match = error.message.match(/(\d+)s/);
        const waitSecs = match ? parseInt(match[1], 10) : 60;
        setLockoutUntil(Date.now() + waitSecs * 1000);
        Alert.alert('Too many attempts', `Server rate limit reached. Please wait ${waitSecs}s.`);
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Invalid email or password';
        Alert.alert('Login Failed', errorMessage);

        // Increment local attempt counter
        setAttempts(prev => {
          const newAttempts = prev + 1;
          if (newAttempts >= 5) {
            setLockoutUntil(Date.now() + 60000);
            return 0;
          }
          return newAttempts;
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricSuccess = () => {
    // User authenticated successfully with biometrics
    // Navigation will be handled by auth state change
  };

  const handleBiometricFallback = () => {
    // User wants to use password instead
    setShowBiometric(false);
  };

  const handleSocialSuccess = () => {
    // Social login successful
    // Navigation will be handled by auth state change
  };

  return (
    <>
      <LinearGradient
        colors={['#0A0A0F', '#0F0F18', '#0A0A0F']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        shouldRasterizeIOS
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
                {/* Logo/Brand Section */}
                <View style={styles.brandContainer}>
                  <LinearGradient
                    colors={['#CBFF00', '#9ECC00', '#DBFF4D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.logoCircle}
                    shouldRasterizeIOS
                  >
                    <Text style={styles.logoEmoji}>🏋️</Text>
                  </LinearGradient>

                  <Text style={styles.title}>BARBELLBEATS</Text>
                  <Text style={styles.subtitle}>Your Gym. Your Music. Your Vibe.</Text>

                  {/* Accent bar */}
                  <LinearGradient
                    colors={['#CBFF00', '#DBFF4D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.accentBar}
                    shouldRasterizeIOS
                  />
                </View>

                {/* Form Section with Glassmorphism */}
                <View style={styles.formContainer}>
                  <View style={styles.glassCard}>
                    <Text style={styles.formTitle}>SIGN IN</Text>

                    {/* Biometric Prompt */}
                    {biometricAvailable && biometricEnabled && showBiometric && (
                      <>
                        <BiometricPrompt
                          onSuccess={handleBiometricSuccess}
                          onFallback={handleBiometricFallback}
                        />
                        <AuthDivider />
                      </>
                    )}

                    {/* Email Input with Validation */}
                    <ValidatedInput
                      icon="📧"
                      placeholder="Email"
                      value={form.values.email}
                      onChangeText={(v) => form.handleChange('email', v)}
                      onBlur={() => form.handleBlur('email')}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      textContentType="username"
                      autoComplete="email"
                      error={form.touched.email ? form.errors.email : undefined}
                    />

                    {/* Password Input with Visibility Toggle */}
                    <PasswordInput
                      icon="🔒"
                      placeholder="Password"
                      value={form.values.password}
                      onChangeText={(v) => form.handleChange('password', v)}
                      onBlur={() => form.handleBlur('password')}
                      error={form.touched.password ? form.errors.password : undefined}
                    />

                    {/* Forgot Password Link */}
                    <TouchableOpacity
                      style={styles.forgotButton}
                      onPress={() => navigation.navigate('ForgotPassword')}
                      activeOpacity={0.7}
                      accessibilityRole="link"
                      accessibilityLabel="Forgot password"
                    >
                      <Text style={styles.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>

                    {/* Login Button */}
                    <TouchableOpacity
                      onPress={handleLogin}
                      disabled={loading}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={loading ? 'Logging in' : 'Sign in'}
                      accessibilityState={{ disabled: loading, busy: loading }}
                    >
                      <LinearGradient
                        colors={['#CBFF00', '#4A7A00']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.button, loading && styles.buttonDisabled]}
                        shouldRasterizeIOS
                      >
                        <Text style={styles.buttonText}>
                          {loading ? 'LOGGING IN...' : 'LET\'S GO 💪'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Social Login Section */}
                    <AuthDivider />

                    <AppleSignInButton onSuccess={handleSocialSuccess} />
                    <GoogleSignInButton onSuccess={handleSocialSuccess} />

                    {/* Dev Mode Hint */}
                    {__DEV__ && (
                      <Text style={styles.hint}>
                        No account yet? Tap Create Account below — auth is local.
                      </Text>
                    )}

                    {/* Register Link */}
                    <TouchableOpacity
                      style={styles.registerLink}
                      onPress={() => navigation.navigate('Register')}
                      activeOpacity={0.7}
                      accessibilityRole="link"
                      accessibilityLabel="Create an account"
                    >
                      <Text style={styles.registerText}>
                        New here? <Text style={styles.registerTextBold}>Create an account</Text>
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
                    shouldRasterizeIOS
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
    minHeight: 700,
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
    fontSize: 38,
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
  button: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
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
  forgotButton: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  forgotText: {
    color: '#DBFF4D',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  hint: {
    marginTop: 20,
    textAlign: 'center',
    color: '#8B9482',
    fontSize: 13,
    fontWeight: '600',
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 12,
  },
  registerText: {
    color: '#9B9BAD',
    fontSize: 13,
  },
  registerTextBold: {
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
