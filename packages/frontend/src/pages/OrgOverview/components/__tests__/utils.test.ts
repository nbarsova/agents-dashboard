import { describe, expect,it } from 'vitest';

import { formatChannel } from '../utils';

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
