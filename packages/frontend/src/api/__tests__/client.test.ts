import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest';

import { apiDelete,ApiError, apiGet } from '../client';

// Mock import.meta.env
vi.stubEnv('VITE_API_URL', 'http://localhost:3000/api');

const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string): string | null => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

vi.stubGlobal('localStorage', mockLocalStorage);

describe('apiGet', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.restoreAllMocks();
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns unwrapped data on success', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ data: { id: '1', name: 'test' } }),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const result = await apiGet('/items');
    expect(result).toEqual({ id: '1', name: 'test' });
  });

  it('throws ApiError on 404', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      json: vi.fn().mockResolvedValue({ message: 'Not found' }),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    await expect(apiGet('/items/999')).rejects.toThrow(ApiError);
    await expect(apiGet('/items/999')).rejects.toMatchObject({ status: 404 });
  });

  it('includes Authorization header when token exists', async () => {
    mockLocalStorage.getItem.mockReturnValue('my-token');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ data: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await apiGet('/items');

    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers['Authorization']).toBe('Bearer my-token');
  });

  it('does not include Authorization header when no token', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ data: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await apiGet('/items');

    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers['Authorization']).toBeUndefined();
  });

  it('handles non-JSON error body gracefully', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error('not json')),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    await expect(apiGet('/items')).rejects.toThrow('Request failed');
  });
});

describe('apiDelete', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.restoreAllMocks();
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  it('resolves on success', async () => {
    const mockResponse = { ok: true, status: 204 };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    await expect(apiDelete('/items/1')).resolves.toBeUndefined();
  });

  it('throws ApiError on failure', async () => {
    const mockResponse = {
      ok: false,
      status: 403,
      json: vi.fn().mockResolvedValue({ message: 'Forbidden' }),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    await expect(apiDelete('/items/1')).rejects.toThrow(ApiError);
  });
});
