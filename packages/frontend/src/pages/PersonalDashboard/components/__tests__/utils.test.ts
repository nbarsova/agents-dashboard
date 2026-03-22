import { describe, expect,it } from 'vitest';

import { getBarColor,statusColor } from '../utils';

describe('statusColor', () => {
  it('returns success class for success', () => {
    expect(statusColor('success')).toBe('text-success');
  });

  it('returns red class for failure', () => {
    expect(statusColor('failure')).toBe('text-red-500');
  });

  it('returns alert class for timeout', () => {
    expect(statusColor('timeout')).toBe('text-alert');
  });

  it('returns secondary class for unknown status', () => {
    expect(statusColor('unknown')).toBe('text-text-secondary');
  });
});

describe('getBarColor', () => {
  it('returns red for 100% and above', () => {
    expect(getBarColor(100)).toBe('bg-red-500');
    expect(getBarColor(150)).toBe('bg-red-500');
  });

  it('returns alert for 80-99%', () => {
    expect(getBarColor(80)).toBe('bg-alert');
    expect(getBarColor(99)).toBe('bg-alert');
  });

  it('returns primary for below 80%', () => {
    expect(getBarColor(79)).toBe('bg-primary');
    expect(getBarColor(0)).toBe('bg-primary');
    expect(getBarColor(50)).toBe('bg-primary');
  });
});
