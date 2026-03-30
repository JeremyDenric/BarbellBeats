import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import devLog from "../utils/devLog";

const STORAGE_KEY = "@bb_active_gym_id";

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
    AsyncStorage.setItem(STORAGE_KEY, gymId).catch((err) => {
      devLog.warn('[GymContext] Failed to persist gym ID:', err);
    });
  }, []);

  const value = useMemo(
    () => ({ activeGymId, setActiveGymId }),
    [activeGymId, setActiveGymId]
  );

  return (
    <GymContext.Provider value={value}>
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
