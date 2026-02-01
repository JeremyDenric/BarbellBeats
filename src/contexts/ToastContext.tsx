import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Animated, StyleSheet, Text, View, Platform } from 'react-native';
import { useThemeMode } from './ThemeContext';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../theme/tokens';

type ToastType = 'success' | 'error' | 'info';

type ToastOptions = {
  type?: ToastType;
  durationMs?: number;
};

type ToastState = {
  message: string;
  type: ToastType;
  durationMs: number;
};

type ToastContextValue = {
  showToast: (message: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DEFAULT_DURATION_MS = 2600;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const [toast, setToast] = useState<ToastState | null>(null);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    setToast({
      message,
      type: options?.type ?? 'info',
      durationMs: options?.durationMs ?? DEFAULT_DURATION_MS,
    });
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 16, stiffness: 180 }),
    ]).start();

    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -12, duration: 160, useNativeDriver: true }),
      ]).start(() => setToast(null));
    }, toast.durationMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [toast, opacity, translateY]);

  const tone = toast?.type === 'success'
    ? colors.primary
    : toast?.type === 'error'
      ? colors.error
      : colors.accent;

  const icon = toast?.type === 'success' ? '✅' : toast?.type === 'error' ? '⚠️' : 'ℹ️';

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity,
              transform: [{ translateY }],
            },
          ]}
          pointerEvents="none"
        >
          <View
            style={[
              styles.toast,
              {
                backgroundColor: colors.surface,
                borderColor: `${tone}40`,
                shadowColor: tone,
              },
            ]}
          >
            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor: `${tone}20`,
                  borderColor: `${tone}40`,
                },
              ]}
            >
              <Text style={styles.icon}>{icon}</Text>
            </View>
            <Text style={[styles.toastText, { color: colors.textPrimary }]}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
    top: Platform.OS === 'ios' ? SPACING.lg : SPACING.md,
    zIndex: 999,
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 14,
  },
  toastText: {
    ...TYPOGRAPHY.presets.body,
    flex: 1,
  },
});
