import { describe, expect,it } from 'vitest';

import { getBarColor,statusColor } from '../utils';

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
