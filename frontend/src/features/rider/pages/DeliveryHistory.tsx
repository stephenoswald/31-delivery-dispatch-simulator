import { PageHeading, Panel } from '../../../components/ui';
import { OrderTable } from '../../../components/ui/OrderTable';
import { QueryBoundary } from '../../../components/feedback/QueryBoundary';
import { useRiderOrders } from '../hooks/useRider';
export default function DeliveryHistory() {
  const query = useRiderOrders();
  return (
    <>
      <PageHeading
        eyebrow="THE ROADS YOU’VE TRAVELLED"
        title="Delivery history"
        description="Completed, cancelled, and expired deliveries."
      />
      <Panel>
        <QueryBoundary query={query}>
          <OrderTable orders={query.data ?? []} role="rider" history />
        </QueryBoundary>
      </Panel>
    </>
  );
}
