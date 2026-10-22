import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Order } from '../../../types/order';
import { Badge } from '../../../components/ui';
import { orderCode, area } from '../../../lib/constants';
export function DeliverySummary({ order }: { order: Order }) {
  return (
    <div className="active-delivery-summary">
      <div>
        <strong>#{orderCode(order.id)}</strong>
        <Badge status={order.status} />
      </div>
      <p>
        {area(order.pickup_address)} <ArrowRight size={13} /> {area(order.dropoff_address)}
      </p>
      <Link className="button button-secondary w-full" to={`/customer/orders/${order.id}/tracking`}>
        Track delivery
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}
