import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { api, allPages, ApiError, tokenStore } from './apiClient';
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => vi.unstubAllGlobals());
describe('API client', () => {
  it('sends the selected session token and JSON body', async () => {
    tokenStore.set('test-token');
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 1 })));
    vi.stubGlobal('fetch', fetcher);
    await api('/auth/me');
    expect(fetcher.mock.calls[0][0]).toBe('/api/v1/auth/me');
    expect(fetcher.mock.calls[0][1].headers.Authorization).toBe('Bearer test-token');
  });
  it('expires an authenticated session on 401', async () => {
    tokenStore.set('invalid');
    const listener = vi.fn();
    window.addEventListener('auth-expired', listener);
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ detail: 'Expired' }), { status: 401 })),
    );
    await expect(api('/auth/me')).rejects.toThrow('Expired');
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener('auth-expired', listener);
  });
  it('handles backend validation and network failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ detail: [{ loc: ['body', 'recipient_phone'], msg: 'Too short' }] }),
            { status: 422 },
          ),
        ),
    );
    await expect(api('/customer/orders')).rejects.toThrow('recipient_phone: Too short');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(api('/auth/me')).rejects.toBeInstanceOf(ApiError);
  });
  it('fetches subsequent pages instead of silently truncating records', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(Array.from({ length: 100 }, (_, i) => i))))
      .mockResolvedValueOnce(new Response(JSON.stringify([100])));
    vi.stubGlobal('fetch', fetcher);
    expect(await allPages('/admin/users')).toHaveLength(101);
    expect(fetcher.mock.calls[1][0]).toContain('offset=100');
  });
});
