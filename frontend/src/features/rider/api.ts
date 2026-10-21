import { api, allPages, post, patch } from '../../lib/apiClient';
import type { Order, Review } from '../../types/order';
import type { Rider, NearbyDelivery } from '../../types/rider';
// The existing API requires its invitation reference for acceptance. Keep that
// transport detail here; screens consume pending deliveries, not offer models.
interface RequestEnvelope {
  id: number;
  expires_at: string;
  order: Order;
}
export const riderApi = {
  profile: () => api<Rider>('/rider/profile'),
  availability: (status: 'available' | 'offline') =>
    patch<Rider>('/rider/availability', { status }),
  orders: () => allPages<Order>('/rider/orders'),
  order: (id: number) => api<Order>(`/rider/orders/${id}`),
  requests: async (): Promise<NearbyDelivery[]> => {
    const rows = await allPages<RequestEnvelope>('/rider/offers');
    return rows.map(({ id, expires_at, order }) => ({
      ...order,
      requestId: id,
      expiresAt: expires_at,
    }));
  },
  accept: (reference: number) => post<Order>(`/rider/offers/${reference}/accept`),
  decline: (reference: number) => post<unknown>(`/rider/offers/${reference}/reject`),
  progress: (id: number, status: 'picked_up' | 'in_transit' | 'delivered') =>
    patch<Order>(`/rider/orders/${id}/status`, { status }),
  reviews: () => allPages<Review>('/rider/reviews'),
};
