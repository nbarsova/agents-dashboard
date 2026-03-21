export function parsePeriod(period?: string): Date {
  const now = new Date();
  if (!period) {
    // Default 30 days
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const match = period.match(/^(\d+)(d|w|m)$/);
  if (!match) {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'd':
      return new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
    case 'w':
      return new Date(now.getTime() - value * 7 * 24 * 60 * 60 * 1000);
    case 'm': {
      const date = new Date(now);
      date.setMonth(date.getMonth() - value);
      return date;
    }
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}
