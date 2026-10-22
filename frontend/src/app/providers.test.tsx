import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Providers } from './providers';
import { useAuth } from '../hooks/useAuth';
import { queryClient } from '../lib/queryClient';
import { user } from '../test/fixtures';
function Session() {
  const auth = useAuth();
  return (
    <>
      <p>{auth.user ? 'Signed in' : 'Signed out'}</p>
      <button
        onClick={() => {
          void auth.logout();
        }}
      >
        Sign out
      </button>
    </>
  );
}
beforeEach(() => {
  queryClient.clear();
  localStorage.clear();
  sessionStorage.clear();
  sessionStorage.setItem('swiftdispatch-token', 'rider-token');
});
afterEach(() => {
  cleanup();
  queryClient.clear();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});
it('updates server availability before clearing the stored session', async () => {
  let finish!: (value: Response) => void;
  const fetcher = vi.fn().mockImplementation((url: string) =>
    url.endsWith('/auth/logout')
      ? new Promise<Response>((resolve) => {
          finish = resolve;
        })
      : Promise.resolve(new Response(JSON.stringify({ ...user, role: 'rider' }))),
  );
  vi.stubGlobal('fetch', fetcher);
  render(
    <Providers>
      <Session />
    </Providers>,
  );
  await screen.findByText('Signed in');
  await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  expect(sessionStorage.getItem('swiftdispatch-token')).toBe('rider-token');
  const call = fetcher.mock.calls.find(([url]) => url.endsWith('/auth/logout'))!;
  expect(call[1].method).toBe('POST');
  expect(call[1].headers.Authorization).toBe('Bearer rider-token');
  finish(new Response(JSON.stringify({ status: 'signed_out' })));
  await waitFor(() => expect(sessionStorage.getItem('swiftdispatch-token')).toBeNull());
  expect(screen.getByText('Signed out')).toBeTruthy();
});
it('keeps the session and explains retry when the server cannot sign out', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockImplementation((url: string) =>
        url.endsWith('/auth/logout')
          ? Promise.reject(new Error('offline'))
          : Promise.resolve(new Response(JSON.stringify({ ...user, role: 'rider' }))),
      ),
  );
  render(
    <Providers>
      <Session />
    </Providers>,
  );
  await screen.findByText('Signed in');
  await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  await screen.findByText('Could not sign out. Please retry so your availability can be updated.');
  expect(sessionStorage.getItem('swiftdispatch-token')).toBe('rider-token');
  expect(screen.getByText('Signed in')).toBeTruthy();
});
