import { api, post } from '../../lib/apiClient';
import type { Credentials, LoginResult } from '../../types/auth';
import type { User } from '../../types/user';
export const authApi = {
  login: (data: Credentials) => post<LoginResult>('/auth/login', data),
  me: () => api<User>('/auth/me'),
};
