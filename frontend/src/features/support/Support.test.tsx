import { afterEach, expect, it, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Support from './Support';
import { api, allPages, post } from '../../lib/apiClient';
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 1, role: 'customer' } }) }));
vi.mock('../../lib/apiClient', () => ({
  api: vi.fn(),
  allPages: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}));
vi.mock('../customer/api', () => ({ customerApi: { orders: vi.fn().mockResolvedValue([]) } }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it('shows the order conversation and sends a customer reply', async () => {
  const ticket = {
    id: 7,
    order_id: 3,
    customer_id: 1,
    subject: 'Package missing',
    status: 'open',
    created_at: '2026-10-22T10:00:00',
  };
  vi.mocked(api).mockResolvedValue(ticket);
  vi.mocked(allPages).mockImplementation(async (path) =>
    path.endsWith('/messages')
      ? ([
          {
            id: 2,
            author_id: 5,
            author_name: 'Admin',
            author_role: 'admin',
            body: 'We are checking with the rider.',
            created_at: ticket.created_at,
          },
        ] as never)
      : ([ticket] as never),
  );
  vi.mocked(post).mockResolvedValue({ status: 'sent' });
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={cache}>
      <MemoryRouter initialEntries={['/customer/support?ticket=7']}>
        <Support />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  expect(await screen.findByText('We are checking with the rider.')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'View SD00003' }).getAttribute('href')).toBe(
    '/customer/orders/3',
  );
  expect(screen.queryByRole('button', { name: 'Mark resolved' })).toBeNull();
  await userEvent.type(screen.getByLabelText('Reply'), 'Thank you, please update me.');
  await userEvent.click(screen.getByRole('button', { name: 'Send message' }));
  await waitFor(() =>
    expect(post).toHaveBeenCalledWith('/support/tickets/7/messages', {
      body: 'Thank you, please update me.',
    }),
  );
  cache.clear();
});
