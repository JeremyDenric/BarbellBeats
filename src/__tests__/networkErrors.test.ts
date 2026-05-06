/**
 * @jest-environment node
 */
import { isNetworkError } from "../utils/networkErrors";

describe("isNetworkError", () => {
  it("detects common network failures", () => {
    const error = new Error("Network request failed");
    expect(isNetworkError(error)).toBe(true);
  });

  it("detects timeout errors", () => {
    const error = new Error("Request timed out");
    expect(isNetworkError(error)).toBe(true);
  });

  it("detects abort errors", () => {
    const error = new Error("Aborted");
    error.name = "AbortError";
    expect(isNetworkError(error)).toBe(true);
  });

  it("returns false for non-network errors", () => {
    const error = new Error("Validation failed");
    expect(isNetworkError(error)).toBe(false);
  });
});
