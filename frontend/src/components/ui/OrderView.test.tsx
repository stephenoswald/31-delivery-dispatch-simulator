import { afterEach, beforeEach, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { OrderView } from './OrderView';
import { OverlayProvider } from '../feedback/OverlayProvider';
import { queryClient } from '../../lib/queryClient';
import { customerApi } from '../../features/customer/api';
import { riderApi } from '../../features/rider/api';
import { order, user } from '../../test/fixtures';
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user }) }));
vi.mock('../../features/customer/api', () => ({
  customerApi: { order: vi.fn(), tracking: vi.fn(), cancel: vi.fn() },
}));
vi.mock('../../features/rider/api', () => ({ riderApi: { order: vi.fn(), progress: vi.fn() } }));
beforeEach(() => {
  queryClient.clear();
  vi.clearAllMocks();
  vi.mocked(customerApi.tracking).mockResolvedValue({
    order_id: 1,
    tracking_code: 'tracking',
    status: 'assigned',
    rider_id: 1,
    latest_location: null,
    events: [],
  });
});
afterEach(() => {
  cleanup();
  queryClient.clear();
});
function view(role: 'customer' | 'rider' = 'customer') {
  render(
    <QueryClientProvider client={queryClient}>
      <OverlayProvider>
        <MemoryRouter initialEntries={[`/${role}/orders/1`]}>
          <Routes>
            <Route path={`/${role}/orders/:id`} element={<OrderView role={role} tracking />} />
          </Routes>
        </MemoryRouter>
      </OverlayProvider>
    </QueryClientProvider>,
  );
}
it('shows an actual assigned rider and permits pre-pickup cancellation', async () => {
  vi.mocked(customerApi.order).mockResolvedValue({ ...order, status: 'assigned', rider_id: 3 });
  view();
  await screen.findByRole('heading', { name: 'Your rider has accepted' });
  expect(screen.getByText('Rider #3')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Cancel delivery' })).toBeTruthy();
  expect(screen.queryByText('Confirm delivery')).toBeNull();
});
it('provides expired-request recovery without impossible actions', async () => {
  vi.mocked(customerApi.order).mockResolvedValue({ ...order, status: 'expired' });
  view();
  await screen.findByRole('heading', { name: 'This request has expired' });
  expect(screen.getByRole('link', { name: /Create another delivery/ })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Cancel delivery' })).toBeNull();
});
it('keeps the backend-required transit step before delivery confirmation', async () => {
  vi.mocked(riderApi.order).mockResolvedValue({ ...order, status: 'picked_up', rider_id: 1 });
  view('rider');
  await screen.findByRole('button', { name: 'Start delivery' });
  expect(screen.queryByRole('button', { name: 'Confirm delivery' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Cancel delivery' })).toBeNull();
});
