import { describe, expect,it } from 'vitest';

import { formatChannel, statusColor } from '../utils';

describe('formatChannel', () => {
  it('uppercases simple channels', () => {
    expect(formatChannel('cli')).toBe('CLI');
    expect(formatChannel('web')).toBe('WEB');
    expect(formatChannel('api')).toBe('API');
  });

  it('strips integration: prefix', () => {
    expect(formatChannel('integration:slack')).toBe('slack');
    expect(formatChannel('integration:linear')).toBe('linear');
  });

  it('strips web:custom: prefix', () => {
    expect(formatChannel('web:custom:myapp')).toBe('myapp');
  });

  it('handles empty string', () => {
    expect(formatChannel('')).toBe('');
  });
});

describe('statusColor', () => {
  it('returns success classes for success', () => {
    expect(statusColor('success')).toBe('bg-success/10 text-success');
  });

  it('returns red classes for failure', () => {
    expect(statusColor('failure')).toBe('bg-red-100 text-red-600');
  });

  it('returns alert classes for timeout', () => {
    expect(statusColor('timeout')).toBe('bg-alert/10 text-alert');
  });

  it('returns default classes for unknown status', () => {
    expect(statusColor('unknown')).toBe('bg-bg-alt text-text-secondary');
  });

  it('returns default classes for empty string', () => {
    expect(statusColor('')).toBe('bg-bg-alt text-text-secondary');
  });
});
