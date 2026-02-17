/**
 * ValidatedInput Component
 *
 * Enhanced input field with:
 * - Real-time validation with debounce
 * - Inline error messages
 * - Success/error state visual feedback
 * - iOS password autofill support
 * - Accessibility labels
 * - Glassmorphic design
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  Animated,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../theme/tokens';

export type ValidationRule = {
  test: (value: string) => boolean;
  message: string;
};

export interface ValidatedInputProps extends TextInputProps {
  label?: string;
  icon?: string;
  error?: string;
  validationRules?: ValidationRule[];
  debounceMs?: number;
  onValidationChange?: (isValid: boolean, errorMessage: string) => void;
  showSuccessState?: boolean;
}

export default function ValidatedInput({
  label,
  icon,
  error: externalError,
  validationRules = [],
  debounceMs = 300,
  onValidationChange,
  showSuccessState = true,
  value,
  onChangeText,
  style,
  ...textInputProps
}: ValidatedInputProps) {
  const [internalError, setInternalError] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [borderAnim] = useState(new Animated.Value(0));

  const error = externalError || internalError;
  const hasValue = !!value && value.length > 0;

  /**
   * Validate input value against all rules
   */
  const validate = useCallback(
    (inputValue: string) => {
      if (!inputValue || inputValue.length === 0) {
        setInternalError('');
        setIsValid(false);
        onValidationChange?.(false, '');
        return;
      }

      for (const rule of validationRules) {
        if (!rule.test(inputValue)) {
          setInternalError(rule.message);
          setIsValid(false);
          onValidationChange?.(false, rule.message);
          return;
        }
      }

      // All rules passed
      setInternalError('');
      setIsValid(true);
      onValidationChange?.(true, '');
    },
    [validationRules, onValidationChange]
  );

  /**
   * Debounced validation effect
   */
  useEffect(() => {
    if (!value) {
      setInternalError('');
      setIsValid(false);
      return;
    }

    const timeout = setTimeout(() => {
      validate(value);
    }, debounceMs);

    return () => clearTimeout(timeout);
  }, [value, validate, debounceMs]);

  /**
   * Border animation on focus
   */
  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, borderAnim]);

  const handleFocus = () => {
    setIsFocused(true);
    textInputProps.onFocus?.({} as any);
  };

  const handleBlur = () => {
    setIsFocused(false);
    textInputProps.onBlur?.({} as any);
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? COLORS.light.error : 'rgba(255, 255, 255, 0.1)',
      error ? COLORS.light.error : COLORS.light.primary,
    ],
  });

  const showSuccess = showSuccessState && isValid && !error && hasValue;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <Animated.View
        style={[
          styles.inputContainer,
          { borderColor },
          error && styles.inputContainerError,
          showSuccess && styles.inputContainerSuccess,
        ]}
      >
        {icon && (
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{icon}</Text>
          </View>
        )}

        <TextInput
          style={[styles.input, style]}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={COLORS.light.textTertiary}
          selectionColor={COLORS.light.primary}
          {...textInputProps}
        />

        {showSuccess && (
          <View style={styles.successIndicator}>
            <Text style={styles.successIcon}>✓</Text>
          </View>
        )}
      </Animated.View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.base,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.light.textSecondary,
    marginBottom: SPACING.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  inputContainerError: {
    borderColor: COLORS.light.error,
    borderWidth: 1.5,
  },
  inputContainerSuccess: {
    borderColor: COLORS.light.success,
    borderWidth: 1,
  },
  iconContainer: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    padding: SPACING.base,
    fontSize: TYPOGRAPHY.sizes.base,
    color: '#FFFFFF',
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  successIndicator: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 18,
    color: COLORS.light.success,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  errorIcon: {
    fontSize: 14,
    marginRight: SPACING.xs,
  },
  errorText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.light.error,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});
