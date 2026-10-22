import { afterEach, beforeEach, it, expect, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import { Providers } from '../../../app/providers';
import { queryClient } from '../../../lib/queryClient';
import { user } from '../../../test/fixtures';
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  queryClient.clear();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  queryClient.clear();
});
function loginPage() {
  render(
    <Providers>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<h1>Admin workspace</h1>} />
        </Routes>
      </MemoryRouter>
    </Providers>,
  );
}
it('selects demo credentials and logs in to the account’s role', async () => {
  const fetcher = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        access_token: 'demo-token',
        user: { ...user, role: 'admin' },
        expires_in: 3600,
      }),
    ),
  );
  vi.stubGlobal('fetch', fetcher);
  loginPage();
  expect(screen.queryByText('TAKE A LOOK AROUND')).toBeNull();
  expect(screen.queryByText(/All demo accounts use/)).toBeNull();
  const ui = userEvent.setup();
  await ui.click(screen.getByRole('button', { name: 'Admin' }));
  expect((screen.getByLabelText('Email address') as HTMLInputElement).value).toBe(
    'admin@example.com',
  );
  expect((screen.getByLabelText('Password') as HTMLInputElement).value).toBe('DemoPass123!');
  await ui.click(screen.getByLabelText('Remember me'));
  await ui.click(screen.getByRole('button', { name: 'Sign in' }));
  await screen.findByRole('heading', { name: 'Admin workspace' });
  expect(localStorage.getItem('swiftdispatch-token')).toBe('demo-token');
  expect(JSON.parse(fetcher.mock.calls[0][1].body).email).toBe('admin@example.com');
});
it('shows login errors and keeps the user on the form', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ detail: 'Invalid email or password' }), { status: 401 }),
      ),
  );
  loginPage();
  const ui = userEvent.setup();
  await ui.click(screen.getByRole('button', { name: 'Customer' }));
  await ui.click(screen.getByRole('button', { name: 'Sign in' }));
  await waitFor(() =>
    expect(screen.getByRole('alert').textContent).toContain('Invalid email or password'),
  );
  expect(sessionStorage.getItem('swiftdispatch-token')).toBeNull();
});
