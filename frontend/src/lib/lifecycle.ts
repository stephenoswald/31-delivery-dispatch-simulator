import type { Order, OrderStatus } from '../types/order';
export type Phase = 'pending' | 'accepted' | 'picked_up' | 'delivered' | 'cancelled' | 'expired';
export function phase(status: string): Phase {
  switch (status.toLowerCase()) {
    case 'broadcasting':
    case 'pending':
      return 'pending';
    case 'assigned':
    case 'accepted':
      return 'accepted';
    case 'in_transit':
    case 'picked_up':
      return 'picked_up';
    case 'delivered':
      return 'delivered';
    case 'cancelled':
      return 'cancelled';
    case 'expired':
      return 'expired';
    default:
      return 'pending';
  }
}
export const isActive = (o: Order) => ['accepted', 'picked_up'].includes(phase(o.status));
export const isPending = (o: Order) => phase(o.status) === 'pending';
export const isTerminal = (o: Order) =>
  ['delivered', 'cancelled', 'expired'].includes(phase(o.status));
export const canCancel = (o: Order) => ['pending', 'broadcasting', 'assigned'].includes(o.status);
export function nextStatus(status: OrderStatus) {
  return (
    { assigned: 'picked_up', picked_up: 'in_transit', in_transit: 'delivered' } as Partial<
      Record<OrderStatus, 'picked_up' | 'in_transit' | 'delivered'>
    >
  )[status];
}
export const toDate = (value: string) =>
  new Date(/Z$|[+-]\d{2}:\d{2}$/.test(value) ? value : value + 'Z');
export const dayKey = (value: string) =>
  toDate(value).toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
export function completionRate(orders: Order[]) {
  const terminal = orders.filter(isTerminal);
  return terminal.length
    ? Math.round((terminal.filter((o) => o.status === 'delivered').length / terminal.length) * 100)
    : null;
}
export function averageDuration(orders: Order[]) {
  const durations = orders
    .filter((o) => o.status === 'delivered' && o.delivered_at)
    .map((o) => (toDate(o.delivered_at!).getTime() - toDate(o.created_at).getTime()) / 60000)
    .filter((n) => n >= 0);
  return durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : null;
}
