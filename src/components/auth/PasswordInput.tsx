/**
 * PasswordInput Component
 *
 * Enhanced password input with:
 * - Toggle password visibility (eye icon)
 * - Password strength indicator (weak/medium/strong)
 * - Color-coded strength bar
 * - Haptic feedback on toggle
 * - Extends ValidatedInput
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import ValidatedInput, { ValidatedInputProps } from './ValidatedInput';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../theme/tokens';

export type PasswordStrength = 'weak' | 'medium' | 'strong';

export interface PasswordStrengthResult {
  strength: PasswordStrength;
  color: string;
  message: string;
  score: number;
}

export interface PasswordInputProps extends Omit<ValidatedInputProps, 'secureTextEntry'> {
  showStrengthIndicator?: boolean;
  onStrengthChange?: (result: PasswordStrengthResult) => void;
}

/**
 * Calculate password strength
 */
export function getPasswordStrength(password: string): PasswordStrengthResult {
  if (!password || password.length === 0) {
    return {
      strength: 'weak',
      color: COLORS.light.textTertiary,
      message: 'Enter a password',
      score: 0,
    };
  }

  if (password.length < 8) {
    return {
      strength: 'weak',
      color: COLORS.light.error,
      message: 'Too short (min 8 characters)',
      score: 1,
    };
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const criteriaCount = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  const lengthBonus = password.length >= 12 ? 1 : 0;
  const score = criteriaCount + lengthBonus;

  if (score <= 2) {
    return {
      strength: 'weak',
      color: COLORS.light.error,
      message: 'Weak password',
      score: 2,
    };
  }

  if (score === 3) {
    return {
      strength: 'medium',
      color: COLORS.light.warning,
      message: 'Medium strength',
      score: 3,
    };
  }

  return {
    strength: 'strong',
    color: COLORS.light.success,
    message: 'Strong password',
    score: 4,
  };
}

export default function PasswordInput({
  showStrengthIndicator = false,
  onStrengthChange,
  value,
  ...props
}: PasswordInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const strengthResult = useMemo(() => {
    const result = getPasswordStrength(value || '');
    onStrengthChange?.(result);
    return result;
  }, [value, onStrengthChange]);

  const togglePasswordVisibility = async () => {
    // Haptic feedback on iOS
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsPasswordVisible((prev) => !prev);
  };

  const strengthBarWidth = useMemo(() => {
    switch (strengthResult.score) {
      case 0:
        return '0%';
      case 1:
        return '25%';
      case 2:
        return '40%';
      case 3:
        return '70%';
      case 4:
        return '100%';
      default:
        return '0%';
    }
  }, [strengthResult.score]);

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <ValidatedInput
          {...props}
          value={value}
          secureTextEntry={!isPasswordVisible}
          textContentType="password"
          autoComplete="password"
        />

        {/* Visibility Toggle */}
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={togglePasswordVisibility}
          activeOpacity={0.7}
          accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
          accessibilityRole="button"
        >
          <Text style={styles.toggleIcon}>{isPasswordVisible ? '👁' : '👁‍🗨'}</Text>
        </TouchableOpacity>
      </View>

      {/* Password Strength Indicator */}
      {showStrengthIndicator && value && value.length > 0 && (
        <View style={styles.strengthContainer}>
          <View style={styles.strengthBarBackground}>
            <View
              style={[
                styles.strengthBarFill,
                {
                  width: strengthBarWidth,
                  backgroundColor: strengthResult.color,
                },
              ]}
            />
          </View>

          <Text
            style={[
              styles.strengthText,
              { color: strengthResult.color },
            ]}
          >
            {strengthResult.message}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  inputWrapper: {
    position: 'relative',
  },
  toggleButton: {
    position: 'absolute',
    right: SPACING.base,
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  toggleIcon: {
    fontSize: 20,
  },
  strengthContainer: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  strengthBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: RADIUS.sm,
  },
  strengthText: {
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold as any,
    letterSpacing: 0.5,
  },
});
