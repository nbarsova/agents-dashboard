export function formatChannel(channel: string): string {
  if (channel.startsWith('integration:')) return channel.split(':')[1];
  return channel.toUpperCase();
}
