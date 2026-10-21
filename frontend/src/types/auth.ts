import type { User } from './user';
export interface Credentials {
  email: string;
  password: string;
}
export interface LoginResult {
  access_token: string;
  expires_in: number;
  user: User;
  token_type: string;
}
