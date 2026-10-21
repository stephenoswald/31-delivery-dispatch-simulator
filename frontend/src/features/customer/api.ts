import { api, allPages, post } from '../../lib/apiClient';
import type { Order, DeliveryInput, Review, Tracking } from '../../types/order';
export const customerApi = {
  orders: () => allPages<Order>('/customer/orders'),
  order: (id: number) => api<Order>(`/customer/orders/${id}`),
  create: (data: DeliveryInput) => post<Order>('/customer/orders', data),
  cancel: (id: number) => post<Order>(`/customer/orders/${id}/cancel`),
  tracking: (id: number) => api<Tracking>(`/customer/orders/${id}/tracking`),
  review: (id: number, data: { rating: number; comment: string }) =>
    post<Review>(`/customer/orders/${id}/review`, data),
  getReview: (id: number) => api<Review>(`/customer/orders/${id}/review`),
};
