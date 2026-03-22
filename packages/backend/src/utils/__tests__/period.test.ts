import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest';

import { parsePeriod } from '../period';

describe('parsePeriod', () => {
  const NOW = new Date('2026-03-22T12:00:00.000Z');
  const DAY_MS = 24 * 60 * 60 * 1000;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 30 days ago when no period is provided', () => {
    const result = parsePeriod();
    expect(result.getTime()).toBe(NOW.getTime() - 30 * DAY_MS);
  });

  it('returns 30 days ago for empty string', () => {
    const result = parsePeriod('');
    expect(result.getTime()).toBe(NOW.getTime() - 30 * DAY_MS);
  });

  it('returns 30 days ago for invalid format', () => {
    const result = parsePeriod('abc');
    expect(result.getTime()).toBe(NOW.getTime() - 30 * DAY_MS);
  });

  it('parses 1d correctly', () => {
    const result = parsePeriod('1d');
    expect(result.getTime()).toBe(NOW.getTime() - 1 * DAY_MS);
  });

  it('parses 7d correctly', () => {
    const result = parsePeriod('7d');
    expect(result.getTime()).toBe(NOW.getTime() - 7 * DAY_MS);
  });

  it('parses 30d correctly', () => {
    const result = parsePeriod('30d');
    expect(result.getTime()).toBe(NOW.getTime() - 30 * DAY_MS);
  });

  it('parses 1w as 7 days', () => {
    const result = parsePeriod('1w');
    expect(result.getTime()).toBe(NOW.getTime() - 7 * DAY_MS);
  });

  it('parses 4w as 28 days', () => {
    const result = parsePeriod('4w');
    expect(result.getTime()).toBe(NOW.getTime() - 28 * DAY_MS);
  });

  it('parses 1m as 1 calendar month ago', () => {
    const result = parsePeriod('1m');
    const expected = new Date(NOW);
    expected.setMonth(expected.getMonth() - 1);
    expect(result.getTime()).toBe(expected.getTime());
  });

  it('parses 3m as 3 calendar months ago', () => {
    const result = parsePeriod('3m');
    const expected = new Date(NOW);
    expected.setMonth(expected.getMonth() - 3);
    expect(result.getTime()).toBe(expected.getTime());
  });

  it('parses 0d as current time', () => {
    const result = parsePeriod('0d');
    expect(result.getTime()).toBe(NOW.getTime());
  });

  it('handles large values like 999d', () => {
    const result = parsePeriod('999d');
    expect(result.getTime()).toBe(NOW.getTime() - 999 * DAY_MS);
  });
});
