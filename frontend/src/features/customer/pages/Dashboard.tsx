import { DeliverySummary } from '../components/DeliverySummary';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Plus,
  Package,
  CheckCheck,
  MapPin,
  ArrowUpRight,
  MoveUpRight,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useCustomerOrders } from '../hooks/useCustomer';
import { PageHeading, Stat, Panel } from '../../../components/ui';
import { QueryBoundary } from '../../../components/feedback/QueryBoundary';
import { OrderTable } from '../../../components/ui/OrderTable';
import { DispatchMap } from '../../../components/maps/DispatchMap';
import { ACTIVE } from '../../../lib/constants';
export default function Dashboard() {
  const { user } = useAuth();
  const query = useCustomerOrders();
  const orders = query.data ?? [];
  const active = orders.find((o) => ACTIVE.includes(o.status) || o.status === 'broadcasting');
  return (
    <>
      <PageHeading
        eyebrow="CUSTOMER DASHBOARD"
        title={`Good morning, ${user!.full_name.replace('Demo ', '')}`}
        description="Track your deliveries or create a new request."
        actions={
          <Link to="/customer/new" className="button button-primary">
            <Plus size={17} />
            New delivery
          </Link>
        }
      />
      <div className="stats-grid stats-three">
        <Stat
          label="Total deliveries"
          value={orders.length}
          icon={Package}
          detail="Every package, connected"
        />
        <Stat
          label="On the move"
          value={orders.filter((o) => ACTIVE.includes(o.status)).length}
          icon={MoveUpRight}
          tone="blue"
          detail="Your active deliveries"
        />
        <Stat
          label="Safely delivered"
          value={orders.filter((o) => o.status === 'delivered').length}
          icon={CheckCheck}
          detail="Good things, received"
        />
      </div>
      <div className="customer-dashboard-grid">
        <div>
          <section className="delivery-hero">
            <div>
              <span className="hero-kicker">
                <i />
                YOUR CITY. A LITTLE CLOSER.
              </span>
              <h2>
                Send a package.
                <br />
                Make someone’s day.
              </h2>
              <p>
                Across Port Harcourt, from door to door.
                <br />
                We’ll take it from here.
              </p>
              <Link to="/customer/new" className="button button-light">
                Let’s send something
                <ArrowUpRight size={17} />
              </Link>
            </div>
            <div className="parcel-art">
              <div className="parcel-shadow" />
              <div className="parcel-box">
                <div className="parcel-tape" />
                <Package size={42} />
                <span>with care.</span>
              </div>
              <span className="parcel-float">
                <MapPin size={18} />
                Port Harcourt
              </span>
            </div>
          </section>
          <Panel
            title="Your recent deliveries"
            subtitle="A quick look at where things stand."
            action={
              <Link className="text-link" to="/customer/orders">
                View all
                <ArrowRight size={14} />
              </Link>
            }
          >
            <QueryBoundary query={query}>
              <OrderTable orders={orders} role="customer" compact />
            </QueryBoundary>
          </Panel>
        </div>
        <div className="dashboard-rail">
          <Panel
            title={active ? 'Your delivery, at a glance' : 'Around your neighborhood'}
            subtitle="Fixed demo positions · Port Harcourt"
          >
            <DispatchMap
              order={active}
              point={
                user!.latitude !== null && user!.longitude !== null
                  ? { latitude: user!.latitude!, longitude: user!.longitude! }
                  : undefined
              }
            />
            {active ? (
              <DeliverySummary order={active} />
            ) : (
              <div className="rail-note">
                <span className="icon-tile">
                  <MapPin size={18} />
                </span>
                <p>
                  Your city, one delivery away.
                  <small>Start a delivery to see its journey here.</small>
                </p>
              </div>
            )}
          </Panel>
          <Panel title="A little help along the way">
            <div className="quick-links">
              <Link to="/customer/new">
                <span className="icon-tile">
                  <Plus size={18} />
                </span>
                <span>
                  <strong>Send something new</strong>
                  <small>A few details. We’ll do the rest.</small>
                </span>
                <ArrowUpRight size={17} />
              </Link>
              <Link to="/customer/history">
                <span className="icon-tile tone-blue">
                  <CheckCheck size={18} />
                </span>
                <span>
                  <strong>Retrace a delivery</strong>
                  <small>Find your past deliveries.</small>
                </span>
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </Panel>
          {orders.length === 0 && (
            <div className="tip-card">
              <span>GOOD TO KNOW</span>
              <p>
                Your delivery zone is <strong>Port Harcourt.</strong> Choose a neighborhood when
                booking.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
