import { Check, Package, MapPin, CheckCheck } from 'lucide-react';
import type { Order, OrderEvent } from '../../types/order';
import { date } from '../../lib/constants';
import { phase } from '../../lib/lifecycle';
export function Timeline({ order, events = [] }: { order: Order; events?: OrderEvent[] }) {
  const state = phase(order.status);
  const rank = ['pending', 'accepted', 'picked_up', 'delivered'].indexOf(state);
  const steps = [
    ['pending', 'Request received', Package],
    ['accepted', 'Rider accepted', Check],
    ['picked_up', 'Package picked up', MapPin],
    ['delivered', 'Delivered', CheckCheck],
  ] as const;
  return (
    <ol className="timeline">
      {steps.map(([status, label, Icon], i) => {
        const event = events.find((e) => e.new_status && phase(e.new_status) === status);
        const done = i <= rank || !!event;
        return (
          <li key={status} className={done ? 'step-done' : ''}>
            <span className="timeline-dot">
              <Icon size={16} />
            </span>
            <div>
              <strong>{label}</strong>
              <p>
                {event
                  ? date(event.created_at)
                  : i === 0
                    ? date(order.created_at)
                    : done
                      ? 'Confirmed'
                      : 'Awaiting update'}
              </p>
            </div>
            {done && <Check size={15} />}
          </li>
        );
      })}
      {['cancelled', 'expired'].includes(state) && (
        <li className="step-ended">
          <span className="timeline-dot">×</span>
          <div>
            <strong>{state === 'expired' ? 'Request expired' : 'Delivery cancelled'}</strong>
            <p>
              {state === 'expired'
                ? 'No longer available for acceptance.'
                : 'This request is no longer active.'}
            </p>
          </div>
        </li>
      )}
    </ol>
  );
}
