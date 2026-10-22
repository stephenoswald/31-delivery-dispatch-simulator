import { Link } from 'react-router-dom';
import { ArrowRight, Bike, CheckCheck, Star, Package, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../hooks/useAuth';
import { useRiderProfile, useRiderOrders, useNearbyRequests } from '../hooks/useRider';
import { riderApi } from '../api';
import { Availability } from '../components/Availability';
import { PageHeading, Panel, Stat, Badge, Feedback } from '../../../components/ui';
import { QueryBoundary } from '../../../components/feedback/QueryBoundary';
import { DispatchMap } from '../../../components/maps/DispatchMap';
import { OrderTable } from '../../../components/ui/OrderTable';
import { isActive, toDate } from '../../../lib/lifecycle';
import { usePolling } from '../../../hooks/usePolling';
import { area, orderCode } from '../../../lib/constants';
export default function Dashboard() {
  const { user } = useAuth();
  const profile = useRiderProfile();
  const orders = useRiderOrders();
  const requests = useNearbyRequests();
  const now = usePolling();
  const reviews = useQuery({ queryKey: ['rider', 'reviews'], queryFn: riderApi.reviews });
  const completed = orders.data?.filter((o) => o.status === 'delivered') ?? [];
  const active = orders.data?.find(isActive);
  const average = reviews.data?.length
    ? (reviews.data.reduce((s, r) => s + r.rating, 0) / reviews.data.length).toFixed(1)
    : '—';
  const nearby =
    profile.data?.status === 'available'
      ? (requests.data ?? []).filter((o) => toDate(o.expiresAt).getTime() > now).length
      : 0;
  return (
    <>
      <PageHeading
        title={`Good morning, ${user!.full_name.replace('Demo ', '')}`}
        description="Your deliveries, availability, and activity in one place."
        actions={<Availability />}
      />
      <QueryBoundary query={profile}>
        <div
          className={`rider-banner ${profile.data?.status === 'offline' ? 'rider-banner-offline' : ''}`}
        >
          <span className="rider-banner-icon">
            <Bike size={27} />
          </span>
          <div>
            <h2>
              {active
                ? 'You have an active delivery'
                : profile.data?.status === 'available'
                  ? 'You’re online and ready for requests'
                  : 'You’re currently offline'}
            </h2>
            <p>
              {active
                ? 'Continue your current delivery and update each step.'
                : profile.data?.status === 'available'
                  ? 'Nearby pending requests refresh every 5 seconds.'
                  : 'Go online to receive nearby pending deliveries.'}
            </p>
          </div>
          <Link to={active ? `/rider/orders/${active.id}` : '/rider/requests'}>
            {active ? 'Continue delivery' : 'View requests'}
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="stats-grid stats-three">
          <Stat
            label="Completed deliveries"
            value={completed.length}
            icon={CheckCheck}
            detail="All-time completed journeys"
          />
          <Stat
            label="Nearby requests"
            value={nearby}
            icon={Package}
            tone="blue"
            detail="Eligible pending deliveries"
          />
          <Stat
            label="Customer rating"
            value={average}
            icon={Star}
            tone="orange"
            detail={`${reviews.data?.length ?? 0} reviews`}
          />
        </div>
        <div className="rider-dashboard-grid">
          <Panel
            title="Current location"
            subtitle={`${user!.address ?? 'Port Harcourt'} · simulated position`}
          >
            <DispatchMap riders={profile.data ? [profile.data] : []} order={active} tall />
            <div className="rail-note">
              <span className="icon-tile">
                <MapPin size={18} />
              </span>
              <p>
                Port Harcourt delivery zone<small>Fixed position · no live GPS</small>
              </p>
            </div>
          </Panel>
          <div>
            <Panel title={active ? 'Active delivery' : 'Ready for your next delivery?'}>
              {active ? (
                <div className="active-delivery-summary">
                  <Badge status={active.status} />
                  <h3>#{orderCode(active.id)}</h3>
                  <p>
                    {area(active.pickup_address)} → {area(active.dropoff_address)}
                  </p>
                  <Link className="button button-primary w-full" to={`/rider/orders/${active.id}`}>
                    Continue delivery
                    <ArrowRight size={17} />
                  </Link>
                </div>
              ) : (
                <div className="next-delivery-card">
                  <span className="icon-tile">
                    <Package size={26} />
                  </span>
                  <h3>{nearby ? `${nearby} nearby requests` : 'No active delivery'}</h3>
                  <p>
                    {profile.data?.status === 'offline'
                      ? 'Switch online to view nearby requests.'
                      : 'Open the requests page to accept a delivery.'}
                  </p>
                  <Link className="button button-primary w-full" to="/rider/requests">
                    View nearby requests
                    <ArrowRight size={17} />
                  </Link>
                </div>
              )}
            </Panel>
            <Feedback error={requests.error?.message ?? reviews.error?.message} />
          </div>
        </div>
        <Panel
          title="Recent activity"
          action={
            <Link className="text-link" to="/rider/history">
              View history
              <ArrowRight size={15} />
            </Link>
          }
        >
          <QueryBoundary query={orders}>
            <OrderTable orders={orders.data ?? []} role="rider" compact />
          </QueryBoundary>
        </Panel>
      </QueryBoundary>
    </>
  );
}
