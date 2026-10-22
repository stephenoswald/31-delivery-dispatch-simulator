import { afterEach, it, expect } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { OrderTable } from './OrderTable';
import { order } from '../../test/fixtures';
afterEach(cleanup);
it('filters deliveries by status and search', async () => {
  render(
    <MemoryRouter>
      <OrderTable
        orders={[
          order,
          { ...order, id: 2, status: 'delivered', pickup_address: 'Woji, Port Harcourt' },
        ]}
        role="customer"
      />
    </MemoryRouter>,
  );
  const ui = userEvent.setup();
  await ui.click(screen.getByRole('button', { name: /^Delivered/ }));
  expect(screen.queryByText('#SD00001')).toBeNull();
  expect(screen.getByText('#SD00002')).toBeTruthy();
  await ui.type(screen.getByRole('textbox', { name: 'Search orders' }), 'Borokiri');
  expect(screen.getByText('No matching deliveries')).toBeTruthy();
});
it('paginates and scopes terminal delivery history', async () => {
  render(
    <MemoryRouter>
      <OrderTable
        orders={[
          ...Array.from({ length: 12 }, (_, i) => ({
            ...order,
            id: i + 1,
            status: 'delivered' as const,
          })),
          order,
        ]}
        role="customer"
        history
      />
    </MemoryRouter>,
  );
  expect(screen.getAllByRole('row')).toHaveLength(9);
  await userEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getAllByRole('row')).toHaveLength(5);
  expect(screen.getByText('2 / 2')).toBeTruthy();
});
it('lets the customer resume payment for an unpaid request', () => {
  render(
    <MemoryRouter>
      <OrderTable
        role="customer"
        orders={[
          {
            ...order,
            status: 'pending',
            payment_status: 'unpaid',
            payment_reference: null,
            paid_at: null,
          },
        ]}
      />
    </MemoryRouter>,
  );
  expect(screen.getByText('Payment required')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Pay for order SD00001' }).getAttribute('href')).toBe(
    '/customer/orders/1/payment',
  );
});
