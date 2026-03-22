import { describe, expect, it } from 'vitest';

import { aggregateByWeekday, formatChannel } from '../utils';

describe('formatChannel', () => {
  it('strips integration: prefix', () => {
    expect(formatChannel('integration:slack')).toBe('slack');
    expect(formatChannel('integration:linear')).toBe('linear');
  });

  it('uppercases simple channels', () => {
    expect(formatChannel('cli')).toBe('CLI');
    expect(formatChannel('web')).toBe('WEB');
    expect(formatChannel('api')).toBe('API');
  });

  it('handles empty string', () => {
    expect(formatChannel('')).toBe('');
  });
});

describe('aggregateByWeekday', () => {
  it('returns all days with 0 runs for empty input', () => {
    const result = aggregateByWeekday([]);
    expect(result).toHaveLength(7);
    expect(result.every((d) => d.runs === 0)).toBe(true);
    expect(result[0].day).toBe('Mon');
    expect(result[6].day).toBe('Sun');
  });

  it('assigns runs to the correct weekday', () => {
    // 2026-03-16 is a Monday
    const result = aggregateByWeekday([{ date: '2026-03-16', runs: 5, tokens: 100 }]);
    expect(result[0]).toEqual({ day: 'Mon', runs: 5 });
    expect(result.slice(1).every((d) => d.runs === 0)).toBe(true);
  });

  it('sums runs on the same weekday', () => {
    // 2026-03-16 and 2026-03-23 are both Mondays
    const result = aggregateByWeekday([
      { date: '2026-03-16', runs: 3, tokens: 100 },
      { date: '2026-03-23', runs: 7, tokens: 200 },
    ]);
    expect(result[0]).toEqual({ day: 'Mon', runs: 10 });
  });

  it('distributes runs across a full week', () => {
    // Mon 2026-03-16 through Sun 2026-03-22
    const trends = [
      { date: '2026-03-16', runs: 1, tokens: 0 },
      { date: '2026-03-17', runs: 2, tokens: 0 },
      { date: '2026-03-18', runs: 3, tokens: 0 },
      { date: '2026-03-19', runs: 4, tokens: 0 },
      { date: '2026-03-20', runs: 5, tokens: 0 },
      { date: '2026-03-21', runs: 6, tokens: 0 },
      { date: '2026-03-22', runs: 7, tokens: 0 },
    ];
    const result = aggregateByWeekday(trends);
    expect(result.map((d) => d.runs)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});
