export function calculateTokenCost(
  totalTokens: number,
  pricingPlan: string,
  tokenRate: number | null,
): number | null {
  if (pricingPlan === 'token' && tokenRate) {
    return totalTokens * Number(tokenRate);
  }
  return null;
}

export function calculateSessionUsage(
  used: number,
  limit: number,
): { used: number; limit: number; percentage: number } {
  return {
    used,
    limit,
    percentage: Math.round((used / limit) * 100 * 100) / 100,
  };
}

export function calculateSuccessRate(successCount: number, totalRuns: number): number {
  return totalRuns > 0 ? successCount / totalRuns : 0;
}
