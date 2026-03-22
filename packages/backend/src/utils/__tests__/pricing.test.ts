import { describe, expect,it } from 'vitest';

import { calculateSessionUsage, calculateSuccessRate,calculateTokenCost } from '../pricing';

describe('calculateTokenCost', () => {
  it('calculates cost for token plan', () => {
    expect(calculateTokenCost(1000, 'token', 0.00003)).toBeCloseTo(0.03);
  });

  it('returns 0 cost for zero tokens', () => {
    expect(calculateTokenCost(0, 'token', 0.00003)).toBe(0);
  });

  it('handles large token volumes', () => {
    expect(calculateTokenCost(1_000_000, 'token', 0.00003)).toBeCloseTo(30);
  });

  it('returns null for seat plan', () => {
    expect(calculateTokenCost(1000, 'seat', 0.00003)).toBeNull();
  });

  it('returns null when tokenRate is null', () => {
    expect(calculateTokenCost(1000, 'token', null)).toBeNull();
  });

  it('returns null when tokenRate is 0 (falsy)', () => {
    expect(calculateTokenCost(1000, 'token', 0)).toBeNull();
  });

  it('avoids floating point drift', () => {
    const cost = calculateTokenCost(333, 'token', 0.00003);
    expect(cost).not.toBeNull();
    expect(cost).toBeCloseTo(0.00999, 5);
  });
});

describe('calculateSessionUsage', () => {
  it('calculates 0% for zero used', () => {
    const result = calculateSessionUsage(0, 500);
    expect(result).toEqual({ used: 0, limit: 500, percentage: 0 });
  });

  it('calculates 80% usage', () => {
    const result = calculateSessionUsage(400, 500);
    expect(result).toEqual({ used: 400, limit: 500, percentage: 80 });
  });

  it('calculates 100% at limit', () => {
    const result = calculateSessionUsage(500, 500);
    expect(result).toEqual({ used: 500, limit: 500, percentage: 100 });
  });

  it('calculates over 100% when over limit', () => {
    const result = calculateSessionUsage(600, 500);
    expect(result).toEqual({ used: 600, limit: 500, percentage: 120 });
  });

  it('rounds to 2 decimal places', () => {
    const result = calculateSessionUsage(1, 3);
    expect(result.percentage).toBe(33.33);
  });
});

describe('calculateSuccessRate', () => {
  it('returns 0 when totalRuns is 0 (no division by zero)', () => {
    expect(calculateSuccessRate(0, 0)).toBe(0);
  });

  it('calculates correct rate', () => {
    expect(calculateSuccessRate(90, 100)).toBe(0.9);
  });

  it('returns 1 for perfect success', () => {
    expect(calculateSuccessRate(100, 100)).toBe(1);
  });

  it('returns 0 for no successes', () => {
    expect(calculateSuccessRate(0, 100)).toBe(0);
  });
});
