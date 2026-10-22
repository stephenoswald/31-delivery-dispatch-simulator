import type { Order } from './order';
export interface Rider {
  id: number;
  user_id: number;
  status: 'offline' | 'available' | 'busy';
  vehicle_type: string | null;
  latitude: number | null;
  longitude: number | null;
  location_updated_at: string | null;
  created_at: string;
}
// A pending delivery with the server's acceptance reference; not a separate offer entity.
export interface NearbyDelivery extends Order {
  requestId: number;
  expiresAt: string;
}
