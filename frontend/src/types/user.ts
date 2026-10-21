export type Role = 'admin' | 'customer' | 'rider';
export interface User {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
  zone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}
