import { Link } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { useRiderOrders } from '../hooks/useRider';
import { PageHeading, Panel, Empty, Badge } from '../../../components/ui';
import { QueryBoundary } from '../../../components/feedback/QueryBoundary';
import { DispatchMap } from '../../../components/maps/DispatchMap';
import { ACTIVE, orderCode, area } from '../../../lib/constants';
export default function ActiveDelivery() {
  const query = useRiderOrders();
  const order = query.data?.find((o) => ACTIVE.includes(o.status));
  return (
    <>
      <PageHeading
        eyebrow="ONE JOURNEY AT A TIME"
        title="Active delivery"
        description="View your current route and update the delivery status."
      />
      <QueryBoundary query={query}>
        <Panel>
          {order ? (
            <>
              <DispatchMap order={order} tall />
              <div className="active-delivery-summary">
                <div>
                  <strong>#{orderCode(order.id)}</strong>
                  <Badge status={order.status} />
                </div>
                <p>
                  {area(order.pickup_address)} → {area(order.dropoff_address)}
                </p>
                <Link className="button button-primary" to={`/rider/orders/${order.id}`}>
                  Continue delivery
                  <ArrowRight size={17} />
                </Link>
              </div>
            </>
          ) : (
            <Empty
              title="The next journey is yours."
              description="Accept a request to see your active delivery here."
              icon={MapPin}
              action={
                <Link className="button button-primary" to="/rider/requests">
                  Find a delivery
                  <ArrowRight size={16} />
                </Link>
              }
            />
          )}
        </Panel>
      </QueryBoundary>
    </>
  );
}
