const NETWORK_ERROR_REGEX =
  /Network request failed|NETWORK_ERROR|Network error|timeout|timed out/i;

export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "AbortError" ||
    NETWORK_ERROR_REGEX.test(error.message || "")
  );
}

export default {
  isNetworkError,
};
