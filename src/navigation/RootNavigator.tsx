import React, { useState, useEffect, useCallback } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../contexts/AuthContext";
import { useThemeMode } from "../contexts/ThemeContext";
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
const ONBOARDING_KEY = "@onboarding_complete";

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isDark } = useThemeMode();
  const colors = isDark ? COLORS.dark : COLORS.light;
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((value) => setShowOnboarding(value !== "true"))
      .catch(() => setShowOnboarding(false));
  }, []);

  const handleOnboardingComplete = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    setShowOnboarding(false);
  }, []);

  if (isLoading || showOnboarding === null) {
    return <LoadingView message="Loading your session..." />;
  }

  // Show onboarding only for unauthenticated first-time users
  if (showOnboarding && !isAuthenticated) {
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
