import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Payment from './Payment';
import { customerApi } from '../api';
import { order } from '../../../test/fixtures';
vi.mock('../api', () => ({ customerApi: { order: vi.fn(), pay: vi.fn() } }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
function view() {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={cache}>
      <MemoryRouter initialEntries={['/customer/orders/1/payment']}>
        <Routes>
          <Route path="/customer/orders/:id/payment" element={<Payment />} />
          <Route path="/customer/orders/:id/tracking" element={<h1>Tracking paid delivery</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return cache;
}
it('supports failed simulated payment and a successful retry', async () => {
  vi.mocked(customerApi.order).mockResolvedValue({
    ...order,
    status: 'pending',
    payment_status: 'unpaid',
    delivery_fee_minor: 72900,
    payment_reference: null,
    paid_at: null,
  });
  vi.mocked(customerApi.pay)
    .mockRejectedValueOnce(
      new Error('Simulated payment failed. No money was charged. You can retry.'),
    )
    .mockResolvedValueOnce({ ...order, payment_status: 'paid' });
  const cache = view();
  await userEvent.click(await screen.findByRole('button', { name: 'Simulate failed payment' }));
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(customerApi.pay).toHaveBeenCalledWith(1, 'failed');
  await userEvent.click(screen.getByRole('button', { name: /Pay.*729/ }));
  await screen.findByRole('heading', { name: 'Tracking paid delivery' });
  expect(customerApi.pay).toHaveBeenCalledWith(1, 'success');
  cache.clear();
});
it('does not offer another payment for an already paid delivery', async () => {
  vi.mocked(customerApi.order).mockResolvedValue(order);
  const cache = view();
  await screen.findByRole('heading', { name: 'Payment complete' });
  expect(screen.queryByRole('button', { name: /Pay/ })).toBeNull();
  expect(customerApi.pay).not.toHaveBeenCalled();
  cache.clear();
});
