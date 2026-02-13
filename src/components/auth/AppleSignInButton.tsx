/**
 * AppleSignInButton Component
 *
 * Apple-specific sign-in button with:
 * - Native Apple Sign-In button styling
 * - Black background, white text (iOS standard)
 * - Icon + "Continue with Apple"
 * - Handles authentication flow
 */

import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import SocialLoginButton from './SocialLoginButton';
import { COLORS } from '../../theme/tokens';
import devLog from '../../utils/devLog';

export interface AppleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export default function AppleSignInButton({
  onSuccess,
  onError,
}: AppleSignInButtonProps) {
  const { loginWithApple } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      await loginWithApple();
      onSuccess?.();
    } catch (error) {
      devLog.error('Apple Sign-In failed:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Apple Sign-In failed';

      // User canceled
      if (errorMessage.includes('cancel') || errorMessage.includes('1001')) {
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
      provider="apple"
      icon="🍎"
      label="Continue with Apple"
      onPress={handleAppleSignIn}
      loading={loading}
      backgroundColor="#000000"
      textColor="#FFFFFF"
      borderColor="rgba(255, 255, 255, 0.2)"
    />
  );
}
