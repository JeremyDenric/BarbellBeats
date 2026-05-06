/**
 * @jest-environment node
 */
import { epley, brzycki, lombardi, estimatedOneRepMax } from '../utils/oneRepMax';

describe('epley', () => {
  it('returns the weight unchanged for a single rep', () => {
    expect(epley(225, 1)).toBe(225);
  });

  it('calculates correctly for 5 reps', () => {
    // 225 × (1 + 5/30) = 225 × 1.1667 ≈ 262.5
    expect(epley(225, 5)).toBeCloseTo(262.5, 1);
  });

  it('calculates correctly for 10 reps', () => {
    // 135 × (1 + 10/30) = 135 × 1.333 = 180
    expect(epley(135, 10)).toBeCloseTo(180, 1);
  });

  it('returns 0 for zero weight', () => {
    expect(epley(0, 5)).toBe(0);
  });

  it('returns 0 for zero reps', () => {
    expect(epley(225, 0)).toBe(0);
  });

  it('returns 0 for negative inputs', () => {
    expect(epley(-10, 5)).toBe(0);
    expect(epley(225, -1)).toBe(0);
  });

  it('higher reps always produce a higher estimated 1RM', () => {
    const at5 = epley(100, 5);
    const at10 = epley(100, 10);
    expect(at10).toBeGreaterThan(at5);
  });
});

describe('brzycki', () => {
  it('returns the weight unchanged for a single rep', () => {
    expect(brzycki(225, 1)).toBe(225);
  });

  it('calculates correctly for 5 reps', () => {
    // 225 × (36 / 32) = 225 × 1.125 = 253.125
    expect(brzycki(225, 5)).toBeCloseTo(253.125, 1);
  });

  it('returns 0 for 37+ reps (formula breaks down)', () => {
    expect(brzycki(100, 37)).toBe(0);
    expect(brzycki(100, 50)).toBe(0);
  });

  it('returns 0 for zero weight or reps', () => {
    expect(brzycki(0, 5)).toBe(0);
    expect(brzycki(100, 0)).toBe(0);
  });
});

describe('lombardi', () => {
  it('returns the weight unchanged for a single rep', () => {
    expect(lombardi(225, 1)).toBe(225);
  });

  it('produces a higher estimate than raw weight for multiple reps', () => {
    expect(lombardi(100, 5)).toBeGreaterThan(100);
  });

  it('returns 0 for zero inputs', () => {
    expect(lombardi(0, 5)).toBe(0);
    expect(lombardi(100, 0)).toBe(0);
  });
});

describe('estimatedOneRepMax', () => {
  it('averages epley and brzycki', () => {
    const e = epley(225, 5);
    const b = brzycki(225, 5);
    expect(estimatedOneRepMax(225, 5)).toBeCloseTo((e + b) / 2, 4);
  });

  it('returns 0 when either formula returns 0', () => {
    expect(estimatedOneRepMax(0, 5)).toBe(0);
    expect(estimatedOneRepMax(100, 0)).toBe(0);
  });

  it('is always lower than the raw epley estimate (conservative)', () => {
    // Brzycki is lower than Epley for most rep ranges, so the average is lower
    const e = epley(100, 8);
    const avg = estimatedOneRepMax(100, 8);
    expect(avg).toBeLessThan(e);
  });
});
