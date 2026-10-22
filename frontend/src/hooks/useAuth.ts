import { createContext, useContext } from 'react';
import type { User } from '../types/user';
import type { Credentials } from '../types/auth';
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
  login: (data: Credentials, remember?: boolean) => Promise<User>;
  logout: () => void;
  retry: () => void;
}
export const AuthContext = createContext<AuthState | null>(null);
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('Missing auth provider');
  return value;
}
