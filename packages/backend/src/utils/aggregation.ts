import type { TrendPoint } from '@template/shared';

export function buildTrendMap(
  runs: { createdAt: Date; tokensUsed: number }[],
): TrendPoint[] {
  const trendMap = new Map<string, TrendPoint>();
  for (const run of runs) {
    const date = run.createdAt.toISOString().slice(0, 10);
    const existing = trendMap.get(date);
    if (existing) {
      existing.runs += 1;
      existing.tokens += run.tokensUsed;
    } else {
      trendMap.set(date, { date, runs: 1, tokens: run.tokensUsed });
    }
  }
  return Array.from(trendMap.values());
}
