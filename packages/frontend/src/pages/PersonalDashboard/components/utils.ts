export function statusColor(status: string): string {
  switch (status) {
    case 'success':
      return 'bg-success/10 text-success';
    case 'failure':
      return 'bg-red-100 text-red-600';
    case 'timeout':
      return 'bg-alert/10 text-alert';
    default:
      return 'bg-bg-alt text-text-secondary';
  }
}

export function formatChannel(channel: string): string {
  if (channel.startsWith('integration:')) return channel.split(':')[1];
  if (channel.startsWith('web:custom:')) return channel.split(':')[2];
  return channel.toUpperCase();
}

export function getBarColor(percentage: number): string {
  if (percentage >= 100) return 'bg-red-500';
  if (percentage >= 80) return 'bg-alert';
  return 'bg-primary';
}
