import { OverlayProvider } from '../components/feedback/OverlayProvider';
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import { tokenStore } from '../lib/apiClient';
import { AuthContext } from '../hooks/useAuth';
import { authApi } from '../features/auth/api';
import type { Credentials } from '../types/auth';
function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(tokenStore.get);
  const session = useQuery({
    queryKey: ['session', token],
    queryFn: authApi.me,
    enabled: !!token,
    retry: false,
  });
  const logout = useCallback(() => {
    tokenStore.clear();
    setToken(null);
    queryClient.clear();
  }, []);
  useEffect(() => {
    window.addEventListener('auth-expired', logout);
    return () => window.removeEventListener('auth-expired', logout);
  }, [logout]);
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
