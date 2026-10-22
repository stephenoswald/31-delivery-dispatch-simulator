export type OrderStatus =
  | 'pending'
  | 'broadcasting'
  | 'assigned'
  | 'accepted'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'expired';
export interface DeliveryInput {
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  dropoff_address: string;
  dropoff_latitude: number;
  dropoff_longitude: number;
  recipient_name: string;
  recipient_phone: string;
  package_description?: string | null;
}
export interface PriceQuote {
  distance_km: number;
  base_fare_minor: number;
  rate_per_km_minor: number;
  delivery_fee_minor: number;
  currency: string;
}
export interface Order extends DeliveryInput {
  distance_km: number;
  payment_status: 'unpaid' | 'paid';
  payment_reference: string | null;
  paid_at: string | null;
  id: number;
  tracking_code: string;
  customer_id: number;
  rider_id: number | null;
  status: OrderStatus;
  delivery_fee_minor: number;
  currency: string;
  created_at: string;
  delivered_at: string | null;
}
export interface OrderEvent {
  id: number;
  event_type: string;
  previous_status: string | null;
  new_status: string | null;
  created_at: string;
  details: unknown;
}
export interface Location {
  id: number;
  rider_id: number;
  order_id: number | null;
  latitude: number;
  longitude: number;
  recorded_at: string;
}
export interface Tracking {
  order_id: number;
  tracking_code: string;
  status: OrderStatus;
  rider_id: number | null;
  latest_location: Location | null;
  events: OrderEvent[];
}
export interface Review {
  id: number;
  order_id: number;
  customer_id: number;
  rider_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
}
