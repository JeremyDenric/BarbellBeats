/**
 * Shared UI Primitives
 * Compact, clean, and consistent across screens.
 */

import React, { memo } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  PressableProps,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useThemeMode } from '../contexts/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import {
  COLORS,
  IOS_COLORS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  SHADOWS,
  TOUCH_TARGET,
} from '../theme/tokens';
import AnimatedPressable from './AnimatedPressable';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'prominent';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button = memo<ButtonProps>(({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  haptic = true,
  onPress,
  style,
  textStyle,
  ...rest
}) => {
  const { isDark } = useThemeMode();
  const { preferences } = usePreferences();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const compact = preferences.compactMode;

  const baseSize = {
    small: { paddingVertical: 8, paddingHorizontal: 14, fontSize: 14, radius: RADIUS.md },
    medium: { paddingVertical: 12, paddingHorizontal: 18, fontSize: 15, radius: RADIUS.lg },
    large: { paddingVertical: 14, paddingHorizontal: 22, fontSize: 16, radius: RADIUS.xl },
  }[size];

  const paddingVertical = Math.max(6, baseSize.paddingVertical + (compact ? -3 : 0));
  const paddingHorizontal = Math.max(12, baseSize.paddingHorizontal + (compact ? -4 : 0));
  const minHeight = compact ? Math.max(44, TOUCH_TARGET.min - 4) : TOUCH_TARGET.min;

  const variantStyle = (() => {
    switch (variant) {
      case 'secondary':
        return { backgroundColor: colors.surfaceAlt, borderColor: colors.border };
      case 'outline':
        return { backgroundColor: 'transparent', borderColor: colors.border, borderWidth: 1.5 };
      case 'ghost':
        return { backgroundColor: 'transparent', borderColor: 'transparent' };
      case 'danger':
        return { backgroundColor: colors.error, borderColor: colors.error };
      case 'prominent':
        return { backgroundColor: colors.glass, borderColor: colors.glassBorder, borderWidth: 1 };
      default:
        return { backgroundColor: colors.primary, borderColor: colors.primary };
    }
  })();

  const textColor =
    variant === 'primary' || variant === 'danger'
      ? '#FFFFFF'
      : colors.textPrimary;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled || loading}
      hapticFeedback={haptic}
      style={[
        styles.button,
        {
          paddingVertical,
          paddingHorizontal,
          borderRadius: baseSize.radius,
          minHeight,
        },
        variantStyle,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.buttonDisabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.buttonContent}>
          {icon ? <View style={styles.buttonIcon}>{icon}</View> : null}
          <Text style={[styles.buttonText, { color: textColor, fontSize: baseSize.fontSize }, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
});

Button.displayName = 'Button';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  pressable?: boolean;
  onPress?: () => void;
}

export const Card = memo<CardProps>(({ children, style, pressable, onPress }) => {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;

  const content = (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!pressable) {
    return content;
  }

  return (
    <Pressable onPress={onPress} style={styles.cardPressable}>
      {content}
    </Pressable>
  );
});

Card.displayName = 'Card';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  variant?: 'subtle' | 'prominent';
  tint?: 'light' | 'dark' | 'default';
}

export const GlassCard = memo<GlassCardProps>(({
  children,
  style,
  intensity = 18,
  variant = 'subtle',
  tint = 'default',
}) => {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const borderColor = variant === 'prominent' ? colors.borderStrong : colors.glassBorder;
  const backgroundColor = variant === 'prominent' ? colors.surfaceAlt : colors.glass;

  return (
    <BlurView
      intensity={intensity}
      tint={tint === 'default' ? (isDark ? 'dark' : 'light') : tint}
      style={[
        styles.glassCard,
        { borderColor, backgroundColor },
        style,
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.glassOverlay,
          { backgroundColor: colors.glassOverlay },
        ]}
      />
      {children}
    </BlurView>
  );
});

GlassCard.displayName = 'GlassCard';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
type BadgeSize = 'small' | 'medium' | 'large';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Badge = memo<BadgeProps>(({
  label,
  variant = 'primary',
  size = 'medium',
  icon,
  style,
  textStyle,
}) => {
  const { isDark } = useThemeMode();
  const { preferences } = usePreferences();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const compact = preferences.compactMode;

  const variantMap = {
    primary: { backgroundColor: colors.primary, textColor: '#FFFFFF' },
    success: { backgroundColor: colors.success, textColor: '#FFFFFF' },
    warning: { backgroundColor: colors.warning, textColor: '#1C1914' },
    error: { backgroundColor: colors.error, textColor: '#FFFFFF' },
    info: { backgroundColor: colors.accent, textColor: '#1C1914' },
    neutral: { backgroundColor: colors.surfaceAlt, textColor: colors.textPrimary },
  };

  const sizeMap = {
    small: { paddingVertical: 3, paddingHorizontal: 8, fontSize: 10, radius: 10 },
    medium: { paddingVertical: 4, paddingHorizontal: 10, fontSize: 11, radius: 12 },
    large: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 12, radius: 14 },
  };

  const base = sizeMap[size];
  const paddingVertical = Math.max(2, base.paddingVertical + (compact ? -1 : 0));
  const paddingHorizontal = Math.max(6, base.paddingHorizontal + (compact ? -2 : 0));

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: variantMap[variant].backgroundColor,
          borderRadius: base.radius,
          paddingVertical,
          paddingHorizontal,
        },
        style,
      ]}
    >
      {icon ? <Text style={[styles.badgeIcon, { color: variantMap[variant].textColor }]}>{icon}</Text> : null}
      <Text
        style={[
          styles.badgeText,
          { color: variantMap[variant].textColor, fontSize: base.fontSize },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
});

Badge.displayName = 'Badge';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  actionTextStyle?: StyleProp<TextStyle>;
  actionStyle?: StyleProp<ViewStyle>;
}

export const SectionHeader = memo<SectionHeaderProps>(({
  title,
  subtitle,
  action,
  style,
  titleStyle,
  subtitleStyle,
  actionTextStyle,
  actionStyle,
}) => {
  const { isDark } = useThemeMode();
  const { preferences } = usePreferences();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const compact = preferences.compactMode;

  return (
    <View style={[styles.sectionHeader, compact && styles.sectionHeaderCompact, style]}>
      <View style={styles.sectionText}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }, titleStyle]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }, subtitleStyle]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action ? (
        <Pressable onPress={action.onPress} style={[styles.sectionAction, actionStyle]}>
          <Text style={[styles.sectionActionText, { color: colors.primary }, actionTextStyle]}>
            {action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
});

SectionHeader.displayName = 'SectionHeader';

interface LoadingViewProps {
  message?: string;
}

export const LoadingView = memo<LoadingViewProps>(({ message = 'Loading...' }) => {
  const { isDark } = useThemeMode();
  const { preferences } = usePreferences();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const compact = preferences.compactMode;

  return (
    <View style={[styles.stateContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator color={colors.primary} />
      <Text
        style={[
          styles.stateTitle,
          compact && styles.stateTitleCompact,
          { color: colors.textPrimary },
        ]}
      >
        {message}
      </Text>
    </View>
  );
});

LoadingView.displayName = 'LoadingView';

interface ErrorViewProps {
  error: Error;
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorView = memo<ErrorViewProps>(({
  error,
  title = 'Something went wrong',
  message,
  onRetry,
}) => {
  const { isDark } = useThemeMode();
  const { preferences } = usePreferences();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const compact = preferences.compactMode;

  return (
    <View style={[styles.stateContainer, { backgroundColor: colors.background }]}>
      <Text style={[styles.stateTitle, compact && styles.stateTitleCompact, { color: colors.textPrimary }]}>
        {title}
      </Text>
      <Text style={[styles.stateMessage, { color: colors.textSecondary }]}>
        {message || error.message || 'Please try again.'}
      </Text>
      {onRetry ? (
        <Button title="Retry" onPress={onRetry} size="small" />
      ) : null}
    </View>
  );
});

ErrorView.displayName = 'ErrorView';

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: React.ReactNode;
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
}

export const EmptyState = memo<EmptyStateProps>(({
  title,
  message,
  icon,
  action,
  style,
}) => {
  const { isDark } = useThemeMode();
  const { preferences } = usePreferences();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const compact = preferences.compactMode;

  return (
    <View style={[styles.emptyState, compact && styles.emptyStateCompact, style]}>
      {icon ? <View style={styles.emptyIcon}>{icon}</View> : null}
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{title}</Text>
      {message ? (
        <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>{message}</Text>
      ) : null}
      {action ? (
        <Button
          title={action.label}
          onPress={action.onPress}
          size="small"
          variant="secondary"
        />
      ) : null}
    </View>
  );
});

EmptyState.displayName = 'EmptyState';

interface IOSCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export const IOSCard = memo<IOSCardProps>(({ children, style, onPress }) => {
  const { isDark } = useThemeMode();
  const { preferences } = usePreferences();
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;
  const compact = preferences.compactMode;

  const containerStyle = [
    styles.iosCard,
    { backgroundColor: iosColors.secondarySystemGroupedBackground },
    compact && styles.iosCardCompact,
    style,
  ];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={containerStyle}>
        {children}
      </Pressable>
    );
  }

  return <View style={containerStyle}>{children}</View>;
});

IOSCard.displayName = 'IOSCard';

interface IOSListRowProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  separator?: boolean;
  separatorInset?: number;
  chevron?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const IOSListRow = memo<IOSListRowProps>(({
  children,
  separator = true,
  separatorInset,
  chevron = false,
  onPress,
  onLongPress,
  delayLongPress,
  style,
  ...rest
}) => {
  const { isDark } = useThemeMode();
  const { preferences } = usePreferences();
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;
  const compact = preferences.compactMode;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={delayLongPress}
      style={({ pressed }) => [
        styles.iosRow,
        compact && styles.iosRowCompact,
        { backgroundColor: iosColors.secondarySystemGroupedBackground },
        pressed && styles.iosRowPressed,
        style,
      ]}
      {...rest}
    >
      <View style={styles.iosRowContent}>
        {children}
      </View>
      {chevron ? (
        <Text style={[styles.iosChevron, { color: iosColors.tertiaryLabel }]}>
          {'>'}
        </Text>
      ) : null}
      {separator ? (
        <View
          style={[
            styles.iosSeparator,
            {
              backgroundColor: iosColors.separator,
              left: separatorInset ?? 0,
            },
          ]}
        />
      ) : null}
    </Pressable>
  );
});

IOSListRow.displayName = 'IOSListRow';

interface IOSGroupedListProps {
  children: React.ReactNode;
  header?: string;
  footer?: string;
  style?: StyleProp<ViewStyle>;
}

export const IOSGroupedList = memo<IOSGroupedListProps>(({ children, header, footer, style }) => {
  const { isDark } = useThemeMode();
  const { preferences } = usePreferences();
  const iosColors = isDark ? IOS_COLORS.dark : IOS_COLORS.light;
  const compact = preferences.compactMode;

  return (
    <View style={style}>
      {header ? (
        <Text style={[styles.iosGroupHeader, { color: iosColors.secondaryLabel }]}>
          {header}
        </Text>
      ) : null}
      <View
        style={[
          styles.iosGroupContainer,
          { backgroundColor: iosColors.secondarySystemGroupedBackground },
          compact && styles.iosGroupContainerCompact,
        ]}
      >
        {children}
      </View>
      {footer ? (
        <Text style={[styles.iosGroupFooter, { color: iosColors.tertiaryLabel }]}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
});

IOSGroupedList.displayName = 'IOSGroupedList';

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  fullWidth: {
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonIcon: {
    marginRight: 2,
  },
  buttonText: {
    ...TYPOGRAPHY.presets.bodyBold,
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    ...SHADOWS.xs,
  },
  cardPressable: {
    borderRadius: RADIUS.lg,
  },
  glassCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeIcon: {
    fontSize: 10,
  },
  badgeText: {
    ...TYPOGRAPHY.presets.caption2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  sectionHeaderCompact: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  sectionText: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.presets.heading2,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.presets.body,
    marginTop: 4,
  },
  sectionAction: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  sectionActionText: {
    ...TYPOGRAPHY.presets.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['2xl'],
    gap: SPACING.md,
  },
  stateTitle: {
    ...TYPOGRAPHY.presets.heading3,
    textAlign: 'center',
  },
  stateTitleCompact: {
    ...TYPOGRAPHY.presets.bodyBold,
  },
  stateMessage: {
    ...TYPOGRAPHY.presets.body,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['3xl'],
    gap: SPACING.sm,
  },
  emptyStateCompact: {
    padding: SPACING['2xl'],
  },
  emptyIcon: {
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    ...TYPOGRAPHY.presets.heading3,
    textAlign: 'center',
  },
  emptyMessage: {
    ...TYPOGRAPHY.presets.body,
    textAlign: 'center',
  },
  iosCard: {
    borderRadius: 16,
    padding: SPACING.lg,
    ...SHADOWS.xs,
  },
  iosCardCompact: {
    padding: SPACING.md,
  },
  iosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: TOUCH_TARGET.min,
  },
  iosRowCompact: {
    paddingVertical: 10,
    minHeight: 44,
  },
  iosRowPressed: {
    opacity: 0.7,
  },
  iosRowContent: {
    flex: 1,
  },
  iosSeparator: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
  iosChevron: {
    fontSize: 16,
    marginLeft: 8,
  },
  iosGroupHeader: {
    ...TYPOGRAPHY.presets.caption2,
    marginBottom: 6,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  iosGroupContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  iosGroupContainerCompact: {
    borderRadius: 14,
  },
  iosGroupFooter: {
    ...TYPOGRAPHY.presets.caption,
    marginTop: 6,
    paddingHorizontal: 4,
  },
});

// Export utility components
export { PlateCalculator } from './PlateCalculator';
export { OneRepMaxCalculator } from './OneRepMaxCalculator';
export { ProgressCharts } from './ProgressCharts';
