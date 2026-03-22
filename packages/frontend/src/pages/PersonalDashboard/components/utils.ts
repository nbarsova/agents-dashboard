export function statusColor(status: string): string {
  switch (status) {
    case 'success':
      return 'text-success';
    case 'failure':
      return 'text-red-500';
    case 'timeout':
      return 'text-alert';
    default:
      return 'text-text-secondary';
  }
}

export function getBarColor(percentage: number): string {
  if (percentage >= 100) return 'bg-red-500';
  if (percentage >= 80) return 'bg-alert';
  return 'bg-primary';
}
