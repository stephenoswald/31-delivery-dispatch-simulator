import { afterEach, it, expect, vi } from 'vitest';
import { riderApi } from './api';
import { order } from '../../test/fixtures';
afterEach(() => vi.unstubAllGlobals());
it('adapts the existing pending-request transport without a frontend offer model', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify([{ id: 42, expires_at: '2026-10-21T10:00:00', order }])),
    );
  vi.stubGlobal('fetch', fetcher);
  const rows = await riderApi.requests();
  expect(rows).toEqual([{ ...order, requestId: 42, expiresAt: '2026-10-21T10:00:00' }]);
  expect(fetcher.mock.calls[0][0]).toBe('/api/v1/rider/offers?limit=100&offset=0');
});
