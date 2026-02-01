import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { useThemeMode } from '../contexts/ThemeContext';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, TOUCH_TARGET } from '../theme/tokens';

interface FormInputProps extends TextInputProps {
  label?: string;
  helperText?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export default function FormInput({
  label,
  helperText,
  containerStyle,
  inputStyle,
  ...props
}: FormInputProps) {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const inputLabel = props.accessibilityLabel || label || props.placeholder || 'Input';

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      ) : null}
      <TextInput
        accessibilityLabel={inputLabel}
        accessibilityHint={props.accessibilityHint || helperText}
        placeholderTextColor={colors.textTertiary}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            color: colors.textPrimary,
            borderColor: colors.border,
          },
          inputStyle,
        ]}
        {...props}
      />
      {helperText ? (
        <Text style={[styles.helper, { color: colors.textTertiary }]}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.xs,
  },
  label: {
    ...TYPOGRAPHY.presets.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: TYPOGRAPHY.sizes.base,
    minHeight: TOUCH_TARGET.min,
  },
  helper: {
    ...TYPOGRAPHY.presets.caption2,
  },
});
