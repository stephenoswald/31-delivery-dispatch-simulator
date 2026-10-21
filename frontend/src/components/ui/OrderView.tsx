import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Package,
  UserRound,
  Phone,
  CheckCheck,
  RefreshCw,
  Star,
  MapPin,
  Clock3,
} from 'lucide-react';
import type { Role } from '../../types/user';
import { customerApi } from '../../features/customer/api';
import { adminApi } from '../../features/admin/api';
import { riderApi } from '../../features/rider/api';
import { queryClient } from '../../lib/queryClient';
import { PageHeading, Panel, Badge, Button, Feedback } from './index';
import { useFeedback } from '../feedback/OverlayProvider';
import { QueryBoundary } from '../feedback/QueryBoundary';
import { Timeline } from '../feedback/Timeline';
import { DispatchMap } from '../maps/DispatchMap';
import { orderCode, date } from '../../lib/constants';
import { canCancel, isPending, isTerminal, nextStatus, phase, toDate } from '../../lib/lifecycle';
import { usePolling } from '../../hooks/usePolling';
import { useAuth } from '../../hooks/useAuth';
export function OrderView({ role, tracking = false }: { role: Role; tracking?: boolean }) {
  const { id } = useParams();
  const orderId = Number(id);
  const feedback = useFeedback();
  const { user } = useAuth();
  const now = usePolling(1000);
  const [radius, setRadius] = useState(5);
  const source = role === 'admin' ? adminApi : role === 'rider' ? riderApi : customerApi;
  const query = useQuery({
    queryKey: [role, 'order', orderId],
    queryFn: () => source.order(orderId),
    refetchInterval: (q) => (q.state.data && isTerminal(q.state.data) ? false : 5000),
  });
  const track = useQuery({
    queryKey: [role, 'tracking', orderId],
    queryFn: () => (role === 'admin' ? adminApi.tracking(orderId) : customerApi.tracking(orderId)),
    enabled: role !== 'rider' && !!query.data,
    refetchInterval: query.data && isTerminal(query.data) ? false : 5000,
  });
  const directory = useQuery({
    queryKey: ['admin', 'participants'],
    queryFn: async () => {
      const [users, riders] = await Promise.all([adminApi.users(), adminApi.riders()]);
      return { users, riders };
    },
    enabled: role === 'admin',
  });
  const mutation = useMutation({
    mutationFn: async (action: 'cancel' | 'retry' | 'picked_up' | 'in_transit' | 'delivered') => {
      if (action === 'cancel')
        return role === 'admin' ? adminApi.cancel(orderId) : customerApi.cancel(orderId);
      if (action === 'retry') return adminApi.broadcast(orderId, radius);
      return riderApi.progress(orderId, action);
    },
    onSuccess: (_, action) => {
      feedback.toast(
        action === 'cancel'
          ? 'Delivery cancelled.'
          : action === 'retry'
            ? 'Delivery request refreshed for nearby riders.'
            : 'Delivery status updated.',
      );
      void queryClient.invalidateQueries();
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: [role, 'order', orderId] });
    },
  });
  const order = query.data;
  const next = order ? nextStatus(order.status) : undefined;
  const state = order ? phase(order.status) : null;
  const waited = order
    ? Math.max(0, Math.floor((now - toDate(order.created_at).getTime()) / 60000))
    : 0;
  const riderProfile = directory.data?.riders.find((r) => r.id === order?.rider_id);
  const riderUser = directory.data?.users.find((u) => u.id === riderProfile?.user_id);
  const customer = directory.data?.users.find((u) => u.id === order?.customer_id);
  async function cancel() {
    if (
      await feedback.confirm({
        title: 'Cancel this delivery?',
        description:
          'This request will no longer be available. Any assigned rider will be released.',
        action: 'Cancel delivery',
        danger: true,
      })
    )
      mutation.mutate('cancel');
  }
  return (
    <>
      <Link to={`/${role}/${role === 'rider' ? 'history' : 'orders'}`} className="back-link">
        <ArrowLeft size={16} />
        All deliveries
      </Link>
      <PageHeading
        title={order ? `Order #${orderCode(order.id)}` : 'Delivery details'}
        description={order ? `${order.pickup_address} → ${order.dropoff_address}` : undefined}
        actions={order && <Badge status={order.status} />}
      />
      <QueryBoundary query={query}>
        {order && (
          <>
            {role === 'customer' && tracking && (
              <div className={`journey-banner journey-${state}`}>
                <span className={`journey-symbol ${state === 'pending' ? 'pulse' : ''}`}>
                  {state === 'pending' ? <MapPin size={25} /> : <CheckCheck size={25} />}
                </span>
                <div>
                  <h2>
                    {state === 'pending'
                      ? 'Finding a rider'
                      : state === 'accepted'
                        ? 'Your rider has accepted'
                        : state === 'picked_up'
                          ? 'Your package is on the way'
                          : state === 'delivered'
                            ? 'Delivered successfully'
                            : state === 'expired'
                              ? 'This request has expired'
                              : 'Delivery cancelled'}
                  </h2>
                  <p>
                    {state === 'pending'
                      ? waited >= 1
                        ? 'Still waiting for an eligible rider. You can keep this page open or cancel and try again.'
                        : 'Your request is ready for nearby available riders. Updates appear automatically.'
                      : state === 'accepted'
                        ? 'Your rider is preparing to collect the package.'
                        : state === 'picked_up'
                          ? 'Follow the delivery timeline below. Locations are simulated.'
                          : state === 'delivered'
                            ? 'Your package has reached its destination. Tell us how it went.'
                            : 'Create a new delivery whenever you’re ready.'}
                  </p>
                </div>
                {state === 'pending' && (
                  <span className="waiting-duration">{waited} min waiting</span>
                )}
              </div>
            )}
            <div className="order-detail-grid">
              <div>
                <Panel
                  title="Delivery route"
                  subtitle="Simulated locations · illustrative straight-line connection"
                >
                  <DispatchMap
                    order={order}
                    point={
                      track.data?.latest_location ??
                      (role === 'rider' && user?.latitude !== null && user?.longitude !== null
                        ? { latitude: user!.latitude!, longitude: user!.longitude! }
                        : undefined)
                    }
                    tall
                  />
                  <div className="detail-route">
                    <div>
                      <span className="route-dot" />
                      <span>
                        <small>PICKUP</small>
                        <strong>{order.pickup_address}</strong>
                      </span>
                    </div>
                    <ArrowRight size={20} />
                    <div>
                      <span className="route-dot orange" />
                      <span>
                        <small>DROP-OFF</small>
                        <strong>{order.dropoff_address}</strong>
                      </span>
                    </div>
                  </div>
                  {track.data?.latest_location && (
                    <div className="location-update">
                      <Clock3 size={14} />
                      Last location snapshot: {date(track.data.latest_location.recorded_at)} ·
                      simulated
                    </div>
                  )}
                </Panel>
                <Panel title="Delivery information">
                  <div className="detail-info-grid">
                    <div>
                      <Package size={19} />
                      <span>
                        <small>Package description</small>
                        <strong>{order.package_description || 'Not provided'}</strong>
                      </span>
                    </div>
                    <div>
                      <UserRound size={19} />
                      <span>
                        <small>Recipient</small>
                        <strong>{order.recipient_name}</strong>
                      </span>
                    </div>
                    <div>
                      <Phone size={19} />
                      <span>
                        <small>Recipient phone</small>
                        <strong>{order.recipient_phone}</strong>
                      </span>
                    </div>
                    <div>
                      <Clock3 size={19} />
                      <span>
                        <small>Requested</small>
                        <strong>{date(order.created_at)}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="tracking-code">
                    <span>Tracking reference</span>
                    <code>{order.tracking_code}</code>
                  </div>
                </Panel>
                <Panel title="Delivery participants">
                  <div className="participants-grid">
                    <div className="participant">
                      <span className="icon-tile">
                        <UserRound size={20} />
                      </span>
                      <div>
                        <small>Customer</small>
                        <strong>
                          {role === 'customer'
                            ? user?.full_name
                            : (customer?.full_name ?? `Customer #${order.customer_id}`)}
                        </strong>
                        <p>
                          {role === 'customer'
                            ? user?.phone
                            : (customer?.phone ?? 'Contact details unavailable')}
                        </p>
                      </div>
                    </div>
                    <div className="participant">
                      <span className="icon-tile tone-blue">
                        <MapPin size={20} />
                      </span>
                      <div>
                        <small>Assigned rider</small>
                        <strong>
                          {order.rider_id
                            ? (riderUser?.full_name ?? `Rider #${order.rider_id}`)
                            : 'Awaiting rider acceptance'}
                        </strong>
                        <p>
                          {riderProfile?.vehicle_type ??
                            (order.rider_id
                              ? 'Rider contact details unavailable'
                              : 'No automatic assignment')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Feedback error={directory.error?.message} />
                </Panel>
              </div>
              <div>
                <Panel title="Delivery timeline" subtitle="Confirmed updates from the server.">
                  <Timeline order={order} events={track.data?.events} />
                  {track.isError && (
                    <Feedback error="Timeline could not be loaded. Updates will retry automatically." />
                  )}
                  <div className="detail-actions">
                    <Feedback error={mutation.error?.message} />
                    {role === 'rider' && next && (
                      <Button
                        disabled={mutation.isPending}
                        className="w-full"
                        onClick={async () => {
                          if (
                            await feedback.confirm({
                              title:
                                next === 'picked_up'
                                  ? 'Confirm pickup'
                                  : next === 'delivered'
                                    ? 'Confirm delivery'
                                    : 'Start delivery',
                              description:
                                next === 'delivered'
                                  ? 'Confirm that the recipient has received this package.'
                                  : next === 'picked_up'
                                    ? 'Confirm that you have collected the package from the pickup address.'
                                    : 'Confirm that you’re taking the collected package to the recipient.',
                              action: next === 'delivered' ? 'Confirm delivery' : 'Confirm',
                            })
                          )
                            mutation.mutate(next);
                        }}
                      >
                        <CheckCheck size={18} />
                        {mutation.isPending
                          ? 'Updating…'
                          : next === 'picked_up'
                            ? 'Confirm pickup'
                            : next === 'delivered'
                              ? 'Confirm delivery'
                              : 'Start delivery'}
                      </Button>
                    )}
                    {role === 'customer' && state === 'delivered' && (
                      <Link
                        className="button button-primary w-full"
                        to={`/customer/orders/${order.id}/review`}
                      >
                        <Star size={18} />
                        Rate & review delivery
                      </Link>
                    )}
                    {role === 'admin' && isPending(order) && (
                      <div className="retry-controls">
                        <label>
                          Pickup radius
                          <select value={radius} onChange={(e) => setRadius(+e.target.value)}>
                            {[5, 10, 15, 25, 50, 100].map((n) => (
                              <option value={n} key={n}>
                                {n} km
                              </option>
                            ))}
                          </select>
                        </label>
                        <Button
                          disabled={mutation.isPending}
                          className="w-full"
                          onClick={() => mutation.mutate('retry')}
                        >
                          <RefreshCw size={17} />
                          Refresh nearby request
                        </Button>
                      </div>
                    )}
                    {role !== 'rider' && canCancel(order) && (
                      <Button
                        className="w-full"
                        variant="danger"
                        disabled={mutation.isPending}
                        onClick={() => {
                          void cancel();
                        }}
                      >
                        Cancel delivery
                      </Button>
                    )}
                    {role === 'rider' && state === 'delivered' && (
                      <Link to="/rider/requests" className="button button-primary w-full">
                        View nearby requests
                        <ArrowRight size={17} />
                      </Link>
                    )}
                    {role === 'customer' && ['expired', 'cancelled'].includes(state!) && (
                      <Link to="/customer/new" className="button button-primary w-full">
                        Create another delivery
                        <ArrowRight size={17} />
                      </Link>
                    )}
                  </div>
                </Panel>
                {state === 'pending' && (
                  <div className="tip-card">
                    <span>WAITING FOR A RIDER</span>
                    <p>
                      Keep this page open for status updates. If no rider responds, an administrator
                      can refresh the request. Requests remain pending until accepted or cancelled.
                    </p>
                  </div>
                )}
                {role === 'rider' && (
                  <div className="tip-card">
                    <span>DELIVERY SIMULATION</span>
                    <p>
                      Confirm pickup, start the delivery, then confirm receipt. Your fixed location
                      does not move as the status changes.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </QueryBoundary>
    </>
  );
}
