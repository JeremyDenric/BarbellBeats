import * as Sentry from "@sentry/react-native";

let globalHandlersRegistered = false;

export function registerGlobalErrorHandlers() {
  if (globalHandlersRegistered) {
    return;
  }

  globalHandlersRegistered = true;
  const ErrorUtils = (global as any)?.ErrorUtils;

  if (ErrorUtils && typeof ErrorUtils.setGlobalHandler === "function") {
    const defaultHandler = ErrorUtils.getGlobalHandler?.();
    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      if (!__DEV__) {
        Sentry.captureException(error, {
          tags: { fatal: isFatal ? "true" : "false" },
        });
      }

      if (typeof defaultHandler === "function") {
        defaultHandler(error, isFatal);
      }
    });
  }

  const globalAny = globalThis as any;
  if (globalAny && "onunhandledrejection" in globalAny) {
    const previousHandler = globalAny.onunhandledrejection;
    globalAny.onunhandledrejection = (event: any) => {
      if (!__DEV__) {
        Sentry.captureException(event?.reason || event, {
          tags: { unhandled_rejection: "true" },
        });
      }

      if (typeof previousHandler === "function") {
        previousHandler(event);
      }
    };
  }
}

export default registerGlobalErrorHandlers;
