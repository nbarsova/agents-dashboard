import { describe, expect, it, vi } from 'vitest';

import { errorHandler } from '../error-handler';

function createMockRes() {
  const res: Record<string, unknown> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler', () => {
  it('returns error.message in development', () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const res = createMockRes();
    const error = new Error('Database connection failed');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(error, {} as never, res as never, vi.fn() as never);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
      message: 'Database connection failed',
    });

    consoleSpy.mockRestore();
    process.env.NODE_ENV = origEnv;
  });

  it('returns generic message in production', () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const res = createMockRes();
    const error = new Error('Sensitive error details');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(error, {} as never, res as never, vi.fn() as never);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
      message: 'Something went wrong',
    });

    consoleSpy.mockRestore();
    process.env.NODE_ENV = origEnv;
  });

  it('returns generic message when NODE_ENV is undefined', () => {
    const origEnv = process.env.NODE_ENV;
    delete process.env.NODE_ENV;

    const res = createMockRes();
    const error = new Error('Some error');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(error, {} as never, res as never, vi.fn() as never);

    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
      message: 'Something went wrong',
    });

    consoleSpy.mockRestore();
    process.env.NODE_ENV = origEnv;
  });
});
