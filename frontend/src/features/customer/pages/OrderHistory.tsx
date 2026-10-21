import { Link, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useCustomerOrders } from '../hooks/useCustomer';
import { PageHeading, Panel } from '../../../components/ui';
import { QueryBoundary } from '../../../components/feedback/QueryBoundary';
import { OrderTable } from '../../../components/ui/OrderTable';
export default function OrderHistory() {
  const query = useCustomerOrders();
  const history = useLocation().pathname.endsWith('history');
  return (
    <>
      <PageHeading
        eyebrow="DELIVERIES"
        title={history ? 'Delivery history' : 'Your deliveries'}
        description={
          history
            ? 'Completed, cancelled, and expired deliveries.'
            : 'Search and follow your delivery requests.'
        }
        actions={
          <Link to="/customer/new" className="button button-primary">
            <Plus size={17} />
            New delivery
          </Link>
        }
      />
      <Panel>
        <QueryBoundary query={query}>
          <OrderTable orders={query.data ?? []} role="customer" history={history} />
        </QueryBoundary>
      </Panel>
    </>
  );
}
