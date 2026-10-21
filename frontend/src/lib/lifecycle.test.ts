import { describe, it, expect } from 'vitest';
import { phase, nextStatus, canCancel, completionRate, averageDuration, toDate } from './lifecycle';
import { order } from '../test/fixtures';
describe('backend-compatible lifecycle', () => {
  it('groups legacy and requested statuses without changing backend requests', () => {
    expect(phase('PENDING')).toBe('pending');
    expect(phase('broadcasting')).toBe('pending');
    expect(phase('ACCEPTED')).toBe('accepted');
    expect(phase('assigned')).toBe('accepted');
    expect(phase('in_transit')).toBe('picked_up');
    expect(phase('EXPIRED')).toBe('expired');
    expect(nextStatus('assigned')).toBe('picked_up');
    expect(nextStatus('picked_up')).toBe('in_transit');
    expect(nextStatus('in_transit')).toBe('delivered');
    expect(nextStatus('delivered')).toBeUndefined();
  });
  it('permits only backend-supported cancellations', () => {
    expect(canCancel(order)).toBe(true);
    expect(canCancel({ ...order, status: 'assigned' })).toBe(true);
    for (const status of ['picked_up', 'delivered', 'expired', 'cancelled'] as const)
      expect(canCancel({ ...order, status })).toBe(false);
  });
  it('calculates real operational metrics and handles empty data', () => {
    expect(completionRate([])).toBeNull();
    expect(averageDuration([])).toBeNull();
    const delivered = {
      ...order,
      status: 'delivered' as const,
      created_at: '2026-10-21T09:00:00',
      delivered_at: '2026-10-21T09:24:00',
    };
    expect(averageDuration([delivered, order])).toBe(24);
    expect(completionRate([delivered, { ...order, status: 'cancelled' }, order])).toBe(50);
  });
  it('normalizes UTC timestamps once', () => {
    expect(toDate('2026-10-21T09:00:00').toISOString()).toBe('2026-10-21T09:00:00.000Z');
    expect(toDate('2026-10-21T09:00:00Z').toISOString()).toBe('2026-10-21T09:00:00.000Z');
  });
});
