import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

const PERSIST_STALE_WINDOW_MS = 1000 * 60 * 30;

export const PERSIST_MAX_AGE_MS = 1000 * 60 * 60 * 6;

export const shouldPersistQuery = (query: any) => {
  if (query?.meta?.persist === false) {
    return false;
  }

  const hasData = query?.state?.data !== undefined;
  const isSuccess = query?.state?.status === "success";
  const isFresh =
    Date.now() - (query?.state?.dataUpdatedAt ?? 0) < PERSIST_STALE_WINDOW_MS;

  return hasData && isSuccess && isFresh;
};

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "RQ_CACHE_V1",
  throttleTime: 1000,
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      retry: (failureCount, error: any) => {
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 10000),
      networkMode: "online",
    },
    mutations: {
      retry: 0,
      onError: (error) => {
        if (__DEV__) console.error("Mutation error:", error);
      },
      networkMode: "online",
    },
  },
});

export default {
  queryClient,
  asyncStoragePersister,
  shouldPersistQuery,
  PERSIST_MAX_AGE_MS,
};
