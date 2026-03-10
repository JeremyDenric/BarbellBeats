import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../contexts/AuthContext";
import { useThemeMode } from "../contexts/ThemeContext";
import { usePreferences } from "../contexts/PreferencesContext";
import { RootStackParamList } from "../types";
import { LoadingView } from "../components/UI";
import { COLORS } from "../theme/tokens";

// Screens
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";
import ForgotPasswordScreen from "../screens/Auth/ForgotPasswordScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import TabNavigator from "./TabNavigator";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const { preferences, updatePreferences } = usePreferences();

  const handleOnboardingComplete = () => {
    // onboardingCompleted is already set by OnboardingScreen via updatePreferences,
    // but guard here in case the user taps "Skip" on a future entry point.
    updatePreferences({ onboardingCompleted: true });
  };

  if (authLoading) {
    return <LoadingView message="Loading your session..." />;
  }

  // Show onboarding for unauthenticated first-time users only
  if (!isAuthenticated && !preferences.onboardingCompleted) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <Stack.Navigator
      id="RootStack"
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
        animation: 'slide_from_right',
        animationDuration: 250,
      }}
    >
      {!isAuthenticated ? (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{
              headerShown: true,
              headerTitle: "Reset Password",
              headerBackButtonDisplayMode: 'minimal',
              presentation: 'modal',
              animation: 'fade_from_bottom',
            }}
          />
        </>
      ) : (
        <Stack.Screen
          name="MainApp"
          component={TabNavigator}
        />
      )}
    </Stack.Navigator>
  );
}
