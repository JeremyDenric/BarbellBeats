import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@active_gym_id";

interface GymContextValue {
  activeGymId: string | null;
  setActiveGymId: (gymId: string) => void;
}

const GymContext = createContext<GymContextValue | undefined>(undefined);

export function GymProvider({ children }: { children: React.ReactNode }) {
  const [activeGymId, setActiveGymIdState] = useState<string | null>(null);

  useEffect(() => {
    const loadGymId = async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setActiveGymIdState(stored);
      }
    };
    loadGymId();
  }, []);

  const setActiveGymId = useCallback((gymId: string) => {
    setActiveGymIdState(gymId);
    AsyncStorage.setItem(STORAGE_KEY, gymId).catch(() => {});
  }, []);

  return (
    <GymContext.Provider value={{ activeGymId, setActiveGymId }}>
      {children}
    </GymContext.Provider>
  );
}

export function useGym() {
  const context = useContext(GymContext);
  if (!context) {
    throw new Error("useGym must be used within GymProvider");
  }
  return context;
}
