/**
 * ScreenErrorBoundary
 * Screen-level error boundary for graceful error handling
 * Prevents full app crashes by catching errors at screen level
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import { useThemeMode } from '../contexts/ThemeContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme/tokens';
import { FEATURE_FLAGS } from '../utils/featureFlags';
import devLog from '../utils/devLog';

interface ScreenErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ScreenErrorBoundary extends React.Component<ScreenErrorBoundaryProps, State> {
  state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    devLog.error('ScreenErrorBoundary caught error:', error, errorInfo);

    // Send to Sentry in production
    if (!__DEV__ && FEATURE_FLAGS.enableTelemetry) {
      Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        tags: {
          screen: this.props.fallbackTitle || 'Unknown',
          boundary: 'ScreenErrorBoundary',
        },
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback
        error={this.state.error}
        onReset={this.handleReset}
        title={this.props.fallbackTitle}
      />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
  title?: string;
}

function ErrorFallback({ error, onReset, title }: ErrorFallbackProps) {
  const navigation = useNavigation();
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      onReset();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={styles.emoji}>⚠️</Text>

        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {title || 'Something went wrong'}
        </Text>

        <Text style={[styles.message, { color: colors.textSecondary }]}>
          Don't worry, your data is safe. Try going back or refreshing.
        </Text>

        {__DEV__ && error && (
          <View style={[styles.errorDetails, {
            backgroundColor: colors.surface,
            borderColor: colors.border
          }]}>
            <Text style={[styles.errorDetailsTitle, { color: colors.textPrimary }]}>
              Error Details:
            </Text>
            <Text style={[styles.errorDetailsText, { color: colors.textSecondary }]}>
              {error.toString()}
            </Text>
            {error.stack && (
              <Text style={[styles.errorDetailsText, { color: colors.textTertiary, fontSize: 11 }]}>
                {error.stack.split('\n').slice(0, 5).join('\n')}
              </Text>
            )}
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Pressable
            onPress={onReset}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: colors.primary },
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
              Try Again
            </Text>
          </Pressable>

          <Pressable
            onPress={handleGoBack}
            style={({ pressed }) => [
              styles.button,
              styles.secondaryButton,
              {
                backgroundColor: 'transparent',
                borderColor: colors.border,
                borderWidth: 1,
              },
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.buttonText, { color: colors.textPrimary }]}>
              Go Back
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.presets.heading2,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  message: {
    ...TYPOGRAPHY.presets.body,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  errorDetails: {
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xl,
    width: '100%',
    borderWidth: 1,
  },
  errorDetailsTitle: {
    ...TYPOGRAPHY.presets.bodyBold,
    marginBottom: SPACING.sm,
  },
  errorDetailsText: {
    ...TYPOGRAPHY.presets.caption,
    fontFamily: 'monospace',
    marginTop: SPACING.xs,
  },
  buttonContainer: {
    width: '100%',
    gap: SPACING.md,
  },
  button: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    // Styles applied inline
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    ...TYPOGRAPHY.presets.bodyBold,
    fontSize: 16,
  },
});
