import { OverlayProvider, useFeedback } from '../components/feedback/OverlayProvider';
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import { tokenStore, ApiError } from '../lib/apiClient';
import { AuthContext } from '../hooks/useAuth';
import { authApi } from '../features/auth/api';
import type { Credentials } from '../types/auth';
function AuthProvider({ children }: { children: ReactNode }) {
  const feedback = useFeedback();
  const [token, setToken] = useState(tokenStore.get);
  const session = useQuery({
    queryKey: ['session', token],
    queryFn: authApi.me,
    enabled: !!token,
    retry: false,
  });
  const clearSession = useCallback(() => {
    tokenStore.clear();
    setToken(null);
    queryClient.clear();
  }, []);
  useEffect(() => {
    window.addEventListener('auth-expired', clearSession);
    return () => window.removeEventListener('auth-expired', clearSession);
  }, [clearSession]);
  async function logout() {
    const signingOutToken = tokenStore.get();
    if (!signingOutToken) {
      clearSession();
      return;
    }
    try {
      await authApi.logout();
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) {
        feedback.toast(
          'Could not sign out. Please retry so your availability can be updated.',
          'info',
        );
        return;
      }
    }
    if (tokenStore.get() === signingOutToken) clearSession();
  }
  async function login(data: Credentials, remember = false) {
    const result = await authApi.login(data);
    queryClient.clear();
    tokenStore.set(result.access_token, remember);
    queryClient.setQueryData(['session', result.access_token], result.user);
    setToken(result.access_token);
    return result.user;
  }
  return (
    <AuthContext.Provider
      value={{
        user: token ? (session.data ?? null) : null,
        loading: !!token && session.isPending,
        error: token ? session.error : null,
        login,
        logout,
        retry: () => {
          void session.refetch();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <OverlayProvider>
        <AuthProvider>{children}</AuthProvider>
      </OverlayProvider>
    </QueryClientProvider>
  );
}
