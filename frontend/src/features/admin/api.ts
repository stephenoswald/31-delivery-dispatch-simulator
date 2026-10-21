import { api, allPages, post, patch } from '../../lib/apiClient';
import type { Order, Review, Tracking } from '../../types/order';
import type { User } from '../../types/user';
import type { Rider } from '../../types/rider';
export interface Analytics {
  total_users: number;
  total_riders: number;
  available_riders: number;
  total_orders: number;
  orders_by_status: Record<string, number>;
  average_rating: number | null;
}
export const adminApi = {
  users: () => allPages<User>('/admin/users'),
  riders: () => allPages<Rider>('/admin/riders'),
  orders: () => allPages<Order>('/admin/orders'),
  order: (id: number) => api<Order>(`/admin/orders/${id}`),
  analytics: () => api<Analytics>('/admin/analytics'),
  reviews: () => allPages<Review>('/admin/reviews'),
  tracking: (id: number) => api<Tracking>(`/admin/orders/${id}/tracking`),
  broadcast: (id: number, radius_km: number) =>
    post<{ offers_sent: number }>(`/admin/orders/${id}/broadcast`, { radius_km }),
  cancel: (id: number) => post<Order>(`/admin/orders/${id}/cancel`),
  activate: (id: number, is_active: boolean) =>
    patch<User>(`/admin/users/${id}/activation`, { is_active }),
};
