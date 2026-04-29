import React from "react";
import { ThemeProvider } from "./ThemeContext";
import { PreferencesProvider } from "./PreferencesContext";
import { ToastProvider } from "./ToastContext";
import { AuthProvider } from "./AuthContext";
import { GymProvider } from "./GymContext";
import { ExerciseProvider } from "./ExerciseContext";
import { ProgramProvider } from "./ProgramContext";
import { TemplateProvider } from "./TemplateContext";
import { WorkoutProvider } from "./WorkoutContext";
import { ProgressProvider } from "./ProgressContext";
import { CardioProvider } from "./CardioContext";
import { SpotifyProvider } from "./SpotifyContext";
import { NetworkProvider } from "./NetworkContext";
import { SubscriptionProvider } from "./SubscriptionContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <PreferencesProvider>
        <ToastProvider>
          <NetworkProvider>
            <AuthProvider>
              <GymProvider>
                <ExerciseProvider>
                  <ProgramProvider>
                    <TemplateProvider>
                      <WorkoutProvider>
                        <ProgressProvider>
                          <CardioProvider>
                            <SpotifyProvider>
                <SubscriptionProvider>{children}</SubscriptionProvider>
              </SpotifyProvider>
                          </CardioProvider>
                        </ProgressProvider>
                      </WorkoutProvider>
                    </TemplateProvider>
                  </ProgramProvider>
                </ExerciseProvider>
              </GymProvider>
            </AuthProvider>
          </NetworkProvider>
        </ToastProvider>
      </PreferencesProvider>
    </ThemeProvider>
  );
}

export default AppProviders;
