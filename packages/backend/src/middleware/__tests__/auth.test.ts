import { decode } from 'jsonwebtoken';
import { beforeEach,describe, expect, it, vi } from 'vitest';

import { authenticate, requireAdmin, signToken } from '../auth';

// Mock prisma
vi.mock('../../index', () => ({
  prisma: {
    membership: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '../../index';

function createMockReq(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    headers: {},
    params: {},
    ...overrides,
  };
}

function createMockRes() {
  const res: Record<string, unknown> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('authenticate', () => {
  it('returns 401 when no Authorization header', () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    authenticate(req as never, res as never, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Missing or invalid token',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header lacks Bearer prefix', () => {
    const req = createMockReq({ headers: { authorization: 'Token abc123' } });
    const res = createMockRes();
    const next = vi.fn();

    authenticate(req as never, res as never, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('sets userId and calls next for valid token', () => {
    const token = signToken('user-123');
    const req = createMockReq({ headers: { authorization: `Bearer ${token}` } });
    const res = createMockRes();
    const next = vi.fn();

    authenticate(req as never, res as never, next);

    expect((req as Record<string, unknown>).userId).toBe('user-123');
    expect(next).toHaveBeenCalled();
  });

  it('returns 401 for expired/invalid token', () => {
    const req = createMockReq({ headers: { authorization: 'Bearer invalid.token.here' } });
    const res = createMockRes();
    const next = vi.fn();

    authenticate(req as never, res as never, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  });
});

describe('requireAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when userId is missing', () => {
    const req = createMockReq({ params: { orgId: 'org-1' } });
    const res = createMockRes();
    const next = vi.fn();

    requireAdmin(req as never, res as never, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Missing authentication',
    });
  });

  it('returns 401 when orgId is missing', () => {
    const req = createMockReq({ userId: 'user-1', params: {} });
    const res = createMockRes();
    const next = vi.fn();

    requireAdmin(req as never, res as never, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('calls next for admin membership', async () => {
    const req = createMockReq({ userId: 'user-1', params: { orgId: 'org-1' } });
    const res = createMockRes();
    const next = vi.fn();

    vi.mocked(prisma.membership.findUnique).mockResolvedValue({
      userId: 'user-1',
      orgId: 'org-1',
      role: 'admin',
    } as never);

    requireAdmin(req as never, res as never, next);

    // Wait for promise to resolve
    await vi.waitFor(() => {
      expect(next).toHaveBeenCalled();
    });
  });

  it('returns 403 for member (not admin) role', async () => {
    const req = createMockReq({ userId: 'user-1', params: { orgId: 'org-1' } });
    const res = createMockRes();
    const next = vi.fn();

    vi.mocked(prisma.membership.findUnique).mockResolvedValue({
      userId: 'user-1',
      orgId: 'org-1',
      role: 'member',
    } as never);

    requireAdmin(req as never, res as never, next);

    await vi.waitFor(() => {
      expect(res.status).toHaveBeenCalledWith(403);
    });
    expect(res.json).toHaveBeenCalledWith({
      error: 'Forbidden',
      message: 'Admin access required',
    });
  });

  it('returns 403 when no membership found', async () => {
    const req = createMockReq({ userId: 'user-1', params: { orgId: 'org-1' } });
    const res = createMockRes();
    const next = vi.fn();

    vi.mocked(prisma.membership.findUnique).mockResolvedValue(null);

    requireAdmin(req as never, res as never, next);

    await vi.waitFor(() => {
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  it('passes error to next when prisma throws', async () => {
    const req = createMockReq({ userId: 'user-1', params: { orgId: 'org-1' } });
    const res = createMockRes();
    const next = vi.fn();
    const dbError = new Error('DB connection failed');

    vi.mocked(prisma.membership.findUnique).mockRejectedValue(dbError);

    requireAdmin(req as never, res as never, next);

    await vi.waitFor(() => {
      expect(next).toHaveBeenCalledWith(dbError);
    });
  });
});

describe('signToken', () => {
  it('returns a decodable JWT with userId', () => {
    const token = signToken('user-456');
    const decoded = decode(token) as { userId: string; exp: number };
    expect(decoded.userId).toBe('user-456');
  });

  it('sets 7d expiry', () => {
    const token = signToken('user-456');
    const decoded = decode(token) as { iat: number; exp: number };
    const sevenDays = 7 * 24 * 60 * 60;
    expect(decoded.exp - decoded.iat).toBe(sevenDays);
  });
});
