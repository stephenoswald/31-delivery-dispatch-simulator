import { Download } from 'lucide-react';
import { useWorkspace } from '../hooks/useWorkspace';
import { PageHeading, Panel, Button } from '../../../components/ui';
import { OrderTable } from '../../../components/ui/OrderTable';
import { QueryBoundary } from '../../../components/feedback/QueryBoundary';
import { exportCsv } from '../../../lib/exportCsv';
import { orderCode } from '../../../lib/constants';
export default function Orders() {
  const query = useWorkspace();
  return (
    <>
      <PageHeading
        title="Orders management"
        description="View, filter, and manage delivery requests."
        actions={
          <Button
            variant="secondary"
            disabled={!query.data?.orders.length}
            onClick={() =>
              exportCsv('swiftdispatch-orders.csv', [
                [
                  'Order',
                  'Customer ID',
                  'Rider ID',
                  'Pickup',
                  'Drop-off',
                  'Status',
                  'Requested UTC',
                  'Delivered UTC',
                ],
                ...query.data!.orders.map((o) => [
                  orderCode(o.id),
                  o.customer_id,
                  o.rider_id,
                  o.pickup_address,
                  o.dropoff_address,
                  o.status,
                  o.created_at,
                  o.delivered_at,
                ]),
              ])
            }
          >
            <Download size={17} />
            Export orders
          </Button>
        }
      />
      <Panel>
        <QueryBoundary query={query}>
          <OrderTable orders={query.data?.orders ?? []} users={query.data?.users} role="admin" />
        </QueryBoundary>
      </Panel>
    </>
  );
}
