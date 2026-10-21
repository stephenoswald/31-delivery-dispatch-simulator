import { afterEach, beforeEach, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OverlayProvider } from '../../../components/feedback/OverlayProvider';
import { ApiError } from '../../../lib/apiClient';
import AvailableOrders from './AvailableOrders';
import { riderApi } from '../api';
import { order } from '../../../test/fixtures';
vi.mock('../hooks/useRider', () => ({
  useNearbyRequests: () => ({
    data: [
      {
        ...order,
        requestId: 7,
        expiresAt: new Date(Date.now() + 60000).toISOString().replace('Z', ''),
      },
    ],
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useRiderProfile: () => ({ data: { status: 'available' }, error: null }),
}));
vi.mock('../api', () => ({
  riderApi: { accept: vi.fn(), decline: vi.fn(), availability: vi.fn() },
}));
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);
function offers() {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}
    >
      <OverlayProvider>
        <MemoryRouter initialEntries={['/rider/requests']}>
          <Routes>
            <Route path="/rider/requests" element={<AvailableOrders />} />
            <Route path="/rider/orders/1" element={<h1>Active delivery</h1>} />
          </Routes>
        </MemoryRouter>
      </OverlayProvider>
    </QueryClientProvider>,
  );
}
it('accepts the selected request and opens the assigned order', async () => {
  vi.mocked(riderApi.accept).mockResolvedValue({ ...order, status: 'assigned', rider_id: 1 });
  offers();
  await userEvent.click(screen.getByRole('button', { name: 'Accept delivery' }));
  await screen.findByRole('heading', { name: 'Active delivery' });
  expect(riderApi.accept).toHaveBeenCalledWith(7);
});
it('shows an acceptance conflict without pretending the order was assigned', async () => {
  vi.mocked(riderApi.accept).mockRejectedValue(
    new ApiError(409, 'Order has already been claimed or cancelled'),
  );
  offers();
  await userEvent.click(screen.getByRole('button', { name: 'Accept delivery' }));
  expect((await screen.findByRole('alert')).textContent).toContain('already been claimed');
  expect(screen.queryByRole('heading', { name: 'Active delivery' })).toBeNull();
});

it('declines the request through the server and reports the result', async () => {
  vi.mocked(riderApi.decline).mockResolvedValue({});
  offers();
  await userEvent.click(screen.getByRole('button', { name: 'Decline' }));
  expect(riderApi.decline).toHaveBeenCalledWith(7);
  expect((await screen.findByRole('status')).textContent).toContain('Request declined.');
});
