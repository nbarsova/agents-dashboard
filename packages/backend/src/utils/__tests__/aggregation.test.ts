import { describe, expect,it } from 'vitest';

import { buildTrendMap } from '../aggregation';

describe('buildTrendMap', () => {
  it('returns empty array for no runs', () => {
    expect(buildTrendMap([])).toEqual([]);
  });

  it('creates a single trend point for one run', () => {
    const runs = [{ createdAt: new Date('2026-03-15T10:00:00Z'), tokensUsed: 500 }];
    const result = buildTrendMap(runs);
    expect(result).toEqual([{ date: '2026-03-15', runs: 1, tokens: 500 }]);
  });

  it('aggregates multiple runs on the same day', () => {
    const runs = [
      { createdAt: new Date('2026-03-15T09:00:00Z'), tokensUsed: 300 },
      { createdAt: new Date('2026-03-15T14:00:00Z'), tokensUsed: 700 },
    ];
    const result = buildTrendMap(runs);
    expect(result).toEqual([{ date: '2026-03-15', runs: 2, tokens: 1000 }]);
  });

  it('produces trend points across multiple days in insertion order', () => {
    const runs = [
      { createdAt: new Date('2026-03-13T10:00:00Z'), tokensUsed: 100 },
      { createdAt: new Date('2026-03-14T10:00:00Z'), tokensUsed: 200 },
      { createdAt: new Date('2026-03-15T10:00:00Z'), tokensUsed: 300 },
    ];
    const result = buildTrendMap(runs);
    expect(result).toHaveLength(3);
    expect(result[0].date).toBe('2026-03-13');
    expect(result[1].date).toBe('2026-03-14');
    expect(result[2].date).toBe('2026-03-15');
  });

  it('counts runs with zero tokens', () => {
    const runs = [{ createdAt: new Date('2026-03-15T10:00:00Z'), tokensUsed: 0 }];
    const result = buildTrendMap(runs);
    expect(result).toEqual([{ date: '2026-03-15', runs: 1, tokens: 0 }]);
  });
});
