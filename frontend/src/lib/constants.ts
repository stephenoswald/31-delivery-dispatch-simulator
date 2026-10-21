export const ZONE = 'Port Harcourt';
export const DEMO_PASSWORD = 'DemoPass123!';
export const PLACES = [
  { label: 'Old GRA', latitude: 4.785, longitude: 7.01 },
  { label: 'D-Line', latitude: 4.805, longitude: 7.005 },
  { label: 'Trans Amadi', latitude: 4.81, longitude: 7.04 },
  { label: 'Diobu', latitude: 4.795, longitude: 6.99 },
  { label: 'Rumuola', latitude: 4.835, longitude: 7.0 },
  { label: 'Woji', latitude: 4.825, longitude: 7.06 },
  { label: 'Elelenwo', latitude: 4.85, longitude: 7.08 },
  { label: 'Borokiri', latitude: 4.755, longitude: 7.035 },
  { label: 'New GRA', latitude: 4.82, longitude: 6.99 },
  { label: 'Rumuokoro', latitude: 4.875, longitude: 7.0 },
];
export const ACTIVE = ['assigned', 'picked_up', 'in_transit'];
export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  broadcasting: 'Finding a rider',
  assigned: 'Accepted',
  accepted: 'Accepted',
  expired: 'Expired',
  picked_up: 'Picked up',
  in_transit: 'In transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  offline: 'Offline',
  available: 'Available',
  busy: 'On delivery',
};
export const date = (value: string, short = false) =>
  new Date(
    value.endsWith('Z') || /[+-]\d\d:\d\d$/.test(value) ? value : value + 'Z',
  ).toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos',
    month: 'short',
    day: 'numeric',
    ...(short ? {} : { hour: 'numeric', minute: '2-digit' }),
  });
export const orderCode = (id: number) => `SD${String(id).padStart(5, '0')}`;
export const area = (address: string) => address.replace(/,?\s*Port Harcourt/gi, '');
