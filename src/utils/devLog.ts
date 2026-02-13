/**
 * Dev-only logging utility.
 * All calls are no-ops in production builds to prevent
 * console noise and potential information leakage.
 */

/* eslint-disable no-console */

export const devLog = {
  log: (...args: unknown[]) => {
    if (__DEV__) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (__DEV__) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (__DEV__) console.error(...args);
  },
};

export default devLog;
