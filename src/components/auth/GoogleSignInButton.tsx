/**
 * GoogleSignInButton Component
 *
 * Google-specific sign-in button with:
 * - Google brand styling (white background with border)
 * - Icon + "Continue with Google"
 * - Handles authentication flow
 */

import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import SocialLoginButton from './SocialLoginButton';
import { COLORS } from '../../theme/tokens';
import devLog from '../../utils/devLog';

export interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
      onSuccess?.();
    } catch (error) {
      devLog.warn('Google Sign-In failed:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Google Sign-In failed';

      // User canceled
      if (errorMessage.includes('cancel') || errorMessage.includes('12501')) {
        return; // Don't show error for user cancellation
      }

      Alert.alert('Sign-In Failed', errorMessage);
      onError?.(error as Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SocialLoginButton
      provider="google"
      icon="G"
      label="Continue with Google"
      onPress={handleGoogleSignIn}
      loading={loading}
      backgroundColor="rgba(255, 255, 255, 0.05)"
      textColor="#FFFFFF"
      borderColor="rgba(255, 255, 255, 0.1)"
    />
  );
}
