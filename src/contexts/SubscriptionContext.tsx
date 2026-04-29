import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert, AppState, AppStateStatus, Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PACKAGE_TYPE,
  PurchasesPackage,
} from 'react-native-purchases';
import { getSecureItem, removeSecureItem, setSecureItem } from '../utils/secureStorage';
import devLog from '../utils/devLog';

const IS_PRO_CACHE_KEY = '@bb_is_pro';
const ENTITLEMENT_ID = 'forge_pro';

// Set EXPO_PUBLIC_RC_API_KEY_IOS / _ANDROID in your .env or EAS secrets
const RC_KEY_IOS = process.env.EXPO_PUBLIC_RC_API_KEY_IOS ?? '';
const RC_KEY_ANDROID = process.env.EXPO_PUBLIC_RC_API_KEY_ANDROID ?? '';

function isEntitlementActive(info: CustomerInfo): boolean {
  return !!info.entitlements.active[ENTITLEMENT_ID];
}

async function cacheProState(pro: boolean) {
  if (pro) {
    await setSecureItem(IS_PRO_CACHE_KEY, 'true');
  } else {
    await removeSecureItem(IS_PRO_CACHE_KEY);
  }
}

export interface SubscriptionContextValue {
  isPro: boolean;
  isLoading: boolean;
  monthlyPackage: PurchasesPackage | null;
  annualPackage: PurchasesPackage | null;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  devUnlockPro: () => Promise<void>;
  devRevokePro: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [annualPackage, setAnnualPackage] = useState<PurchasesPackage | null>(null);
  const [rcReady, setRcReady] = useState(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Optimistic cold-start cache so the app doesn't flash ungated on launch
  useEffect(() => {
    getSecureItem(IS_PRO_CACHE_KEY).then((v) => {
      if (v === 'true') setIsPro(true);
    });
  }, []);

  // Initialize RevenueCat
  useEffect(() => {
    const apiKey = Platform.OS === 'ios' ? RC_KEY_IOS : RC_KEY_ANDROID;
    if (!apiKey) {
      if (__DEV__) devLog.warn('[Subscription] No RevenueCat API key — purchases disabled');
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        if (__DEV__) await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        Purchases.configure({ apiKey });
        setRcReady(true);
        const info = await Purchases.getCustomerInfo();
        const pro = isEntitlementActive(info);
        setIsPro(pro);
        await cacheProState(pro);
      } catch (err) {
        devLog.error('[Subscription] RC init failed:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Load offerings once RevenueCat is ready
  useEffect(() => {
    if (!rcReady) return;
    (async () => {
      try {
        const offerings = await Purchases.getOfferings();
        const pkg = offerings.current?.availablePackages ?? [];
        setMonthlyPackage(pkg.find((p) => p.packageType === PACKAGE_TYPE.MONTHLY) ?? null);
        setAnnualPackage(pkg.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL) ?? null);
      } catch (err) {
        devLog.error('[Subscription] Failed to load offerings:', err);
      }
    })();
  }, [rcReady]);

  // Re-verify entitlement every time the app returns to foreground
  useEffect(() => {
    if (!rcReady) return;
    const sub = AppState.addEventListener('change', async (next: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && next === 'active') {
        try {
          const info = await Purchases.getCustomerInfo();
          const pro = isEntitlementActive(info);
          setIsPro(pro);
          await cacheProState(pro);
        } catch (err) {
          devLog.error('[Subscription] Foreground entitlement check failed:', err);
        }
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, [rcReady]);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      const result = await Purchases.purchasePackage(pkg);
      const pro = isEntitlementActive(result.customerInfo);
      setIsPro(pro);
      await cacheProState(pro);
      return pro;
    } catch (err: any) {
      if (err?.userCancelled) return false;
      devLog.error('[Subscription] Purchase failed:', err);
      Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
      return false;
    }
  }, []);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      const info = await Purchases.restorePurchases();
      const pro = isEntitlementActive(info);
      setIsPro(pro);
      await cacheProState(pro);
      if (!pro) Alert.alert('No Active Subscription', 'No active Forge Pro subscription was found.');
      return pro;
    } catch (err) {
      devLog.error('[Subscription] Restore failed:', err);
      Alert.alert('Restore Failed', 'Could not restore purchases. Please try again.');
      return false;
    }
  }, []);

  const devUnlockPro = useCallback(async () => {
    if (!__DEV__) return;
    await setSecureItem(IS_PRO_CACHE_KEY, 'true');
    setIsPro(true);
  }, []);

  const devRevokePro = useCallback(async () => {
    if (!__DEV__) return;
    await removeSecureItem(IS_PRO_CACHE_KEY);
    setIsPro(false);
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        isPro,
        isLoading,
        monthlyPackage,
        annualPackage,
        purchasePackage,
        restorePurchases,
        devUnlockPro,
        devRevokePro,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
