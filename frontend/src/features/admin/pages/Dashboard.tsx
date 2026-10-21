import { Link } from 'react-router-dom';
import {
  Package,
  Clock3,
  CheckCheck,
  Bike,
  ArrowRight,
  Navigation2,
  XCircle,
  UserCheck,
} from 'lucide-react';
import { useWorkspace } from '../hooks/useWorkspace';
import { PageHeading, Stat, Panel } from '../../../components/ui';
import { QueryBoundary } from '../../../components/feedback/QueryBoundary';
import { DispatchMap } from '../../../components/maps/DispatchMap';
import { OrderTable } from '../../../components/ui/OrderTable';
import { TrendChart, StatusChart } from '../components/OrderCharts';
import { isActive, isPending } from '../../../lib/lifecycle';
export default function Dashboard() {
  const query = useWorkspace();
  const data = query.data;
  return (
    <>
      <PageHeading
        title="Dashboard"
        description="An overview of your delivery operations in Port Harcourt."
        actions={
          <Link to="/admin/tracking" className="button button-primary">
            <Navigation2 size={17} />
            Open tracking
          </Link>
        }
      />
      <QueryBoundary query={query}>
        {data && (
          <>
            <div className="stats-grid admin-stats">
              <Stat label="Total orders" value={data.orders.length} icon={Package} tone="blue" />
              <Stat
                label="Pending orders"
                value={data.orders.filter(isPending).length}
                icon={Clock3}
                tone="orange"
              />
              <Stat
                label="Active deliveries"
                value={data.orders.filter(isActive).length}
                icon={Navigation2}
                tone="blue"
              />
              <Stat
                label="Completed"
                value={data.orders.filter((o) => o.status === 'delivered').length}
                icon={CheckCheck}
              />
              <Stat
                label="Cancelled"
                value={data.orders.filter((o) => o.status === 'cancelled').length}
                icon={XCircle}
                tone="red"
              />
              <Stat
                label="Online riders"
                value={data.riders.filter((r) => r.status !== 'offline').length}
                icon={Bike}
              />
              <Stat
                label="Available riders"
                value={data.riders.filter((r) => r.status === 'available').length}
                icon={UserCheck}
              />
            </div>
            <div className="admin-map-grid">
              <Panel
                title="Delivery network"
                subtitle="Simulated rider locations across Port Harcourt."
                action={
                  <Link className="text-link" to="/admin/tracking">
                    View full map
                    <ArrowRight size={15} />
                  </Link>
                }
              >
                <DispatchMap riders={data.riders} />
                <div className="map-legend">
                  <span>
                    <i className="green" />
                    Available{' '}
                    <strong>{data.riders.filter((r) => r.status === 'available').length}</strong>
                  </span>
                  <span>
                    <i className="blue" />
                    On delivery{' '}
                    <strong>{data.riders.filter((r) => r.status === 'busy').length}</strong>
                  </span>
                  <span>
                    <i className="gray" />
                    Offline{' '}
                    <strong>{data.riders.filter((r) => r.status === 'offline').length}</strong>
                  </span>
                </div>
              </Panel>
              <Panel
                title="Recent orders"
                subtitle="Latest delivery requests."
                action={
                  <Link className="text-link" to="/admin/orders">
                    View all
                    <ArrowRight size={15} />
                  </Link>
                }
              >
                <OrderTable orders={data.orders} users={data.users} role="admin" compact />
              </Panel>
            </div>
            <div className="chart-grid">
              <Panel
                title="Deliveries over time"
                subtitle="Order requests over the last seven days."
              >
                <TrendChart orders={data.orders} />
              </Panel>
              <Panel
                title="Order status distribution"
                subtitle="Current state of all delivery requests."
              >
                <StatusChart orders={data.orders} />
              </Panel>
            </div>
          </>
        )}
      </QueryBoundary>
    </>
  );
}
