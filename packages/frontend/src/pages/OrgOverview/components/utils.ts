import type { TrendPoint } from '@template/shared';

export function formatChannel(channel: string): string {
  if (channel.startsWith('integration:')) return channel.split(':')[1];
  return channel.toUpperCase();
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function aggregateByWeekday(
  trends: TrendPoint[],
): { day: string; runs: number }[] {
  const totals = new Array(7).fill(0) as number[];
  for (const point of trends) {
    const jsDay = new Date(point.date).getUTCDay(); // 0=Sun, 1=Mon, ...
    const idx = jsDay === 0 ? 6 : jsDay - 1; // shift to Mon=0, Sun=6
    totals[idx] += point.runs;
  }
  return WEEKDAY_LABELS.map((day, i) => ({ day, runs: totals[i] }));
}
