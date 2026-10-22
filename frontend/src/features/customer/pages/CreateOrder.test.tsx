import { afterEach, beforeEach, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { OverlayProvider } from '../../../components/feedback/OverlayProvider';
import CreateOrder from './CreateOrder';
import { customerApi } from '../api';
import { user, order } from '../../../test/fixtures';
vi.mock('../../../hooks/useAuth', () => ({ useAuth: () => ({ user }) }));
vi.mock('../api', () => ({ customerApi: { create: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);
function booking() {
  render(
    <OverlayProvider>
      <MemoryRouter initialEntries={['/customer/new']}>
        <Routes>
          <Route path="/customer/new" element={<CreateOrder />} />
          <Route path="/customer/orders/1/tracking" element={<h1>Tracking new delivery</h1>} />
        </Routes>
      </MemoryRouter>
    </OverlayProvider>,
  );
}
it('books fixed Port Harcourt coordinates and opens tracking', async () => {
  vi.mocked(customerApi.create).mockResolvedValue(order);
  booking();
  const ui = userEvent.setup();
  await ui.type(screen.getByLabelText('Recipient’s name *'), 'A recipient');
  await ui.type(screen.getByLabelText('Recipient’s phone *'), '+2340000000005');
  await ui.click(screen.getByRole('button', { name: 'Review & request delivery' }));
  if (screen.queryByRole('dialog'))
    await ui.click(screen.getByRole('button', { name: 'Request delivery' }));
  await screen.findByRole('heading', { name: 'Tracking new delivery' });
  expect(customerApi.create).toHaveBeenCalledWith(
    expect.objectContaining({
      pickup_address: 'Old GRA, Port Harcourt',
      pickup_latitude: 4.785,
      dropoff_latitude: 4.805,
      recipient_name: 'A recipient',
    }),
  );
});
it('rejects a booking with the same pickup and drop-off', async () => {
  booking();
  const ui = userEvent.setup();
  await ui.selectOptions(screen.getByLabelText('Drop-off neighborhood'), '0');
  await ui.type(screen.getByLabelText('Recipient’s name *'), 'Recipient');
  await ui.type(screen.getByLabelText('Recipient’s phone *'), '0000000000');
  await ui.click(screen.getByRole('button', { name: 'Review & request delivery' }));
  if (screen.queryByRole('dialog'))
    await ui.click(screen.getByRole('button', { name: 'Request delivery' }));
  expect(screen.getByRole('alert').textContent).toContain('must be different');
  expect(customerApi.create).not.toHaveBeenCalled();
});

it('keeps cleared coordinates empty and blocks an incomplete request', async () => {
  booking();
  const input = screen.getByLabelText('Pickup latitude *') as HTMLInputElement;
  await userEvent.clear(input);
  expect(input.value).toBe('');
  expect(input.validity.valueMissing).toBe(true);
  expect(customerApi.create).not.toHaveBeenCalled();
});
