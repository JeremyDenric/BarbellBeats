import React, { useEffect, useMemo, useCallback, useRef } from "react";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  Theme,
  useNavigationContainerRef,
} from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { focusManager, onlineManager } from "@tanstack/react-query";
import {
  AppState,
  Platform,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  PersistQueryClientProvider,
} from "@tanstack/react-query-persist-client";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import type { AppStateStatus } from "react-native";
import * as Sentry from "@sentry/react-native";
import RootNavigator from "./src/navigation/RootNavigator";
import { useThemeMode } from "./src/contexts/ThemeContext";
import { AppProviders } from "./src/contexts/AppProviders";
import { useNetwork } from "./src/contexts/NetworkContext";
import { COLORS, TYPOGRAPHY, FONTS } from "./src/theme/tokens";
import OfflineBanner from "./src/components/OfflineBanner";
import {
  asyncStoragePersister,
  PERSIST_MAX_AGE_MS,
  queryClient,
  shouldPersistQuery,
} from "./src/query/reactQuery";
import configureOnlineManager from "./src/query/onlineManager";
import registerGlobalErrorHandlers from "./src/utils/errorHandlers";
import { FEATURE_FLAGS } from "./src/utils/featureFlags";
import { useAppBootstrap } from "./src/hooks/useAppBootstrap";

// ============================================================================
// Sentry Initialization (Production Only)
// ============================================================================

const routingIntegration = Sentry.reactNavigationIntegration();

const sentryDsn = process.env.SENTRY_DSN;
if (!sentryDsn && !__DEV__) {
  // eslint-disable-next-line no-console
  console.error('[Sentry] SENTRY_DSN is not configured — crashes will not be tracked in production.');
}

if (!__DEV__) {
  Sentry.init({
    dsn: sentryDsn,
    environment: 'production',
    // 1% sample rate in production to keep costs low; raise when debugging specific issues
    tracesSampleRate: 0.01,
    enableAutoSessionTracking: true,
    integrations: [routingIntegration],
    enabled: !!sentryDsn,
  });
}

registerGlobalErrorHandlers();
configureOnlineManager();

// ============================================================================
// React Query Setup & Configuration
// ============================================================================

/**
 * Handles app state changes for React Query focus management
 * Ensures queries refetch when app comes to foreground
 */
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== "web") {
    focusManager.setFocused(status === "active");
  }
}

// React Query cache + online manager configuration is centralized in src/query.

// ============================================================================
// Error Boundary Component
// ============================================================================

interface ErrorBoundaryProps {
  onReset?: () => void;
  palette: typeof COLORS.light;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

type BackdropProps = {
  palette: typeof COLORS.light;
  children: React.ReactNode;
};

const AppBackdrop = ({ palette, children }: BackdropProps) => {
  const gradient = [palette.background, palette.backgroundAlt, palette.surface] as const;

  return (
    <View style={styles.backdropRoot}>
      <LinearGradient colors={gradient} style={styles.backdropGradient} />
      <View
        pointerEvents="none"
        style={[
          styles.backdropOrb,
          styles.backdropOrbPrimary,
          { backgroundColor: palette.primary },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.backdropOrb,
          styles.backdropOrbAccent,
          { backgroundColor: palette.accent },
        ]}
      />
      <View pointerEvents="none" style={styles.backdropNoise} />
      {children}
    </View>
  );
};

/**
 * Global error boundary that catches React rendering errors
 * Provides a user-friendly fallback UI with retry capability
 */
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (__DEV__) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
    this.setState({ errorInfo });

    // Send to Sentry in production
    if (!__DEV__ && FEATURE_FLAGS.enableTelemetry) {
      Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  handleReset = () => {
    this.setState({ error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.error) {
      const { palette } = this.props;
      const isLightPalette = palette.background === COLORS.light.background;
      const buttonTextColor = isLightPalette ? COLORS.light.surface : palette.textPrimary;
      return (
        <AppBackdrop palette={palette}>
          <View style={styles.errorContainer}>
            <View
              style={[
                styles.errorCard,
                { backgroundColor: palette.surface, borderColor: palette.border },
              ]}
            >
              <Text style={styles.errorEmoji}>⚠️</Text>
              <Text style={[styles.errorTitle, { color: palette.textPrimary }]}>
                We hit a snag.
              </Text>
              <Text style={[styles.errorMessage, { color: palette.textSecondary }]}>
                Something broke while loading this screen. Your data is safe.
              </Text>

              {__DEV__ && this.state.error && (
                <View
                  style={[
                    styles.errorDetails,
                    {
                      backgroundColor: palette.backgroundAlt,
                      borderColor: palette.border,
                    },
                  ]}
                >
                  <Text style={[styles.errorDetailsTitle, { color: palette.textPrimary }]}>
                    Error Details:
                  </Text>
                  <Text style={[styles.errorDetailsText, { color: palette.textSecondary }]}>
                    {this.state.error.toString()}
                  </Text>
                </View>
              )}

              <Pressable
                onPress={this.handleReset}
                style={({ pressed }) => [
                  styles.retryButton,
                  {
                    backgroundColor: palette.primary,
                    shadowColor: palette.primary,
                  },
                  pressed && styles.retryButtonPressed,
                ]}
              >
                <Text style={[styles.retryButtonText, { color: buttonTextColor }]}>
                  Try Again
                </Text>
              </Pressable>
            </View>
          </View>
        </AppBackdrop>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Loading Fallback Component
// ============================================================================

/**
 * Loading indicator shown during initial app hydration
 */
const LoadingFallback = ({ palette }: { palette: typeof COLORS.light }) => (
  <AppBackdrop palette={palette}>
    <View style={styles.loadingContainer}>
      <View
        style={[
          styles.loadingCard,
          { backgroundColor: palette.surface, borderColor: palette.border },
        ]}
      >
        <Text style={[styles.loadingTitle, { color: palette.textPrimary }]}>
          Barbell Beats
        </Text>
        <Text style={[styles.loadingSubtitle, { color: palette.textSecondary }]}>
          Strength meets sound.
        </Text>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={palette.primary} />
          <Text style={[styles.loadingText, { color: palette.textSecondary }]}>
            Preparing your session...
          </Text>
        </View>
      </View>
    </View>
  </AppBackdrop>
);

// ============================================================================
// Custom Theme Configuration
// ============================================================================

/**
 * Modern Athletic theme - Light mode
 * Warm neutrals with teal and amber accents
 */
const CustomLightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.light.primary,
    background: COLORS.light.background,
    card: COLORS.light.surface,
    text: COLORS.light.textPrimary,
    border: COLORS.light.border,
    notification: COLORS.light.accent,
  },
};

/**
 * Modern Athletic theme - Dark mode
 * Graphite surfaces with teal + amber energy
 */
const CustomDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: COLORS.dark.primary,
    background: COLORS.dark.background,
    card: COLORS.dark.surface,
    text: COLORS.dark.textPrimary,
    border: COLORS.dark.border,
    notification: COLORS.dark.accent,
  },
};

// ============================================================================
// Main App Component
// ============================================================================

// Deep linking configuration
const LINKING_CONFIG = {
  prefixes: ["barbellbeats://"],
  config: {
    screens: {
      MainApp: {
        screens: {
          Home: "home",
          Discover: "discover",
          Training: "training",
          Music: "music",
          Profile: "profile",
        },
      },
    },
  },
};

/**
 * Inner App component that accesses theme context
 * Separated to allow ThemeProvider to wrap it
 */
const AppContent = React.memo(function AppContent() {
  const { isDark } = useThemeMode();
  const { isOffline, queuedActions } = useNetwork();
  const routeNameRef = useRef<string | undefined>(undefined);
  const navigationRef = useNavigationContainerRef();
  const telemetryEnabled = FEATURE_FLAGS.enableTelemetry && !__DEV__;

  // Memoize theme selection based on theme context
  const theme = useMemo(
    () => (isDark ? CustomDarkTheme : CustomLightTheme),
    [isDark]
  );
  const palette = useMemo(() => (isDark ? COLORS.dark : COLORS.light), [isDark]);

  // Set up app state listener for React Query focus management
  useEffect(() => {
    const subscription = AppState.addEventListener("change", onAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleNavigationReady = useCallback(() => {
    if (!__DEV__) {
      routingIntegration.registerNavigationContainer(navigationRef);
    }
    const currentRoute = navigationRef.getCurrentRoute()?.name;
    if (currentRoute) {
      routeNameRef.current = currentRoute;
      if (telemetryEnabled) {
        Sentry.setTag("current_route", currentRoute);
      }
    }
    if (__DEV__) {
      console.log("Navigation ready");
    }
  }, [navigationRef, telemetryEnabled]);

  const handleNavigationStateChange = useCallback(() => {
    const currentRoute = navigationRef.getCurrentRoute()?.name;
    if (!currentRoute) {
      return;
    }

    const previousRoute = routeNameRef.current;
    if (previousRoute && previousRoute !== currentRoute && telemetryEnabled) {
      Sentry.addBreadcrumb({
        category: "navigation",
        message: `${previousRoute} -> ${currentRoute}`,
        level: "info",
      });
    }

    routeNameRef.current = currentRoute;
    if (telemetryEnabled) {
      Sentry.setTag("current_route", currentRoute);
    }
  }, [navigationRef, telemetryEnabled]);

  const offlineMessage =
    queuedActions > 0
      ? `No internet connection (${queuedActions} queued)`
      : "No internet connection";
  const onlineMessage =
    queuedActions > 0
      ? `Back online (syncing ${queuedActions})`
      : "Back online";

  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary onReset={reset} palette={palette}>
          <OfflineBanner
            isOffline={isOffline}
            message={offlineMessage}
            onlineMessage={onlineMessage}
          />
          <NavigationContainer
            ref={navigationRef}
            theme={theme}
            linking={LINKING_CONFIG}
            fallback={<LoadingFallback palette={palette} />}
            onReady={handleNavigationReady}
            onStateChange={handleNavigationStateChange}
          >
            <RootNavigator />
          </NavigationContainer>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
});

/**
 * Root App component with all providers
 */
function App() {
  const hydrationStartRef = useRef(Date.now());
  useAppBootstrap({ enableTelemetry: FEATURE_FLAGS.enableTelemetry });

  // Callback when cache is successfully hydrated
  const onSuccess = useCallback(() => {
    if (onlineManager.isOnline()) {
      queryClient.resumePausedMutations().catch((error) => {
        if (__DEV__) {
          console.warn("Failed to resume paused mutations:", error);
        }
      });
    }

    if (__DEV__) {
      const durationMs = Date.now() - hydrationStartRef.current;
      const queryCount = queryClient.getQueryCache().getAll().length;
      console.log(
        `React Query cache hydrated in ${durationMs}ms (${queryCount} queries)`
      );
    }
  }, []);

  const onPersistError = useCallback(async () => {
    if (__DEV__) {
      console.warn("React Query cache hydration failed. Clearing cache.");
    }

    if (FEATURE_FLAGS.enableTelemetry && !__DEV__) {
      Sentry.captureMessage("React Query cache hydration failed", {
        level: "error",
      });
    }

    if (typeof asyncStoragePersister.removeClient === "function") {
      await asyncStoragePersister.removeClient();
    }
    queryClient.clear();
  }, []);

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: asyncStoragePersister,
          maxAge: PERSIST_MAX_AGE_MS,
          dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
        }}
        onSuccess={onSuccess}
        onError={onPersistError}
      >
        <AppProviders>
          <AppContent />
        </AppProviders>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(App);

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  backdropRoot: {
    flex: 1,
  },
  backdropGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropOrb: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.14,
  },
  backdropOrbPrimary: {
    top: -60,
    right: -40,
  },
  backdropOrbAccent: {
    bottom: -80,
    left: -50,
    opacity: 0.12,
  },
  backdropNoise: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  // Loading Fallback Styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 28,
    borderWidth: 1,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  loadingTitle: {
    ...TYPOGRAPHY.presets.heading1,
  },
  loadingSubtitle: {
    ...TYPOGRAPHY.presets.body,
    marginTop: 6,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
  },
  loadingText: {
    ...TYPOGRAPHY.presets.caption,
  },

  // Error Boundary Styles
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorCard: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 28,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 10,
  },
  errorEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  errorTitle: {
    ...TYPOGRAPHY.presets.heading1,
    textAlign: "center",
  },
  errorMessage: {
    ...TYPOGRAPHY.presets.body,
    marginTop: 12,
    marginBottom: 24,
    textAlign: "center",
  },
  errorDetails: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 24,
    width: "100%",
    borderWidth: 1,
  },
  errorDetailsTitle: {
    ...TYPOGRAPHY.presets.caption,
    fontWeight: "700",
    marginBottom: 8,
  },
  errorDetailsText: {
    fontSize: 12,
    fontFamily: FONTS.mono,
  },
  retryButton: {
    paddingHorizontal: 46,
    paddingVertical: 16,
    borderRadius: 26,
    minWidth: 240,
    alignItems: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  retryButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  retryButtonText: {
    ...TYPOGRAPHY.presets.bodyBold,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
});
