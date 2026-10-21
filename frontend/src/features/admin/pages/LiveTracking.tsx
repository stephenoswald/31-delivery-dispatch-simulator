import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Navigation2, MapPin, Bike, Package } from 'lucide-react';
import { useWorkspace } from '../hooks/useWorkspace';
import { PageHeading, Panel, Badge, Empty, Stat } from '../../../components/ui';
import { QueryBoundary } from '../../../components/feedback/QueryBoundary';
import { DispatchMap } from '../../../components/maps/DispatchMap';
import { isActive, phase } from '../../../lib/lifecycle';
import { area, orderCode } from '../../../lib/constants';
export default function LiveTracking() {
  const query = useWorkspace();
  const [selected, setSelected] = useState<number | null>(null);
  const [status, setStatus] = useState('all');
  const [riderStatus, setRiderStatus] = useState('all');
  const active = query.data?.orders.filter(isActive) ?? [];
  const filtered = active.filter((o) => status === 'all' || phase(o.status) === status);
  const order = filtered.find((o) => o.id === selected) ?? filtered[0];
  const riders =
    query.data?.riders.filter((r) => riderStatus === 'all' || r.status === riderStatus) ?? [];
  return (
    <>
      <PageHeading
        title="Delivery tracking"
        description="Monitor active deliveries and simulated rider locations."
        actions={
          <span className="zone-pill">
            <MapPin size={15} />
            Simulated · Port Harcourt
          </span>
        }
      />
      <QueryBoundary query={query}>
        <div className="stats-grid stats-three">
          <Stat label="Active deliveries" value={active.length} icon={Package} tone="blue" />
          <Stat
            label="Riders online"
            value={query.data?.riders.filter((r) => r.status !== 'offline').length ?? 0}
            icon={Bike}
          />
          <Stat
            label="Riders on delivery"
            value={query.data?.riders.filter((r) => r.status === 'busy').length ?? 0}
            icon={Navigation2}
            tone="orange"
          />
        </div>
        <div className="tracking-filters">
          <label>
            Delivery status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All active deliveries</option>
              <option value="accepted">Accepted</option>
              <option value="picked_up">Picked up / in transit</option>
            </select>
          </label>
          <label>
            Rider status
            <select value={riderStatus} onChange={(e) => setRiderStatus(e.target.value)}>
              <option value="all">All riders</option>
              <option value="available">Available</option>
              <option value="busy">On delivery</option>
              <option value="offline">Offline</option>
            </select>
          </label>
        </div>
        <div className="tracking-grid">
          <Panel
            title={`Active deliveries (${filtered.length})`}
            subtitle="Select a delivery to highlight its route."
          >
            <div className="tracking-list">
              {filtered.length ? (
                filtered.map((o) => (
                  <button
                    key={o.id}
                    className={order?.id === o.id ? 'selected' : ''}
                    onClick={() => setSelected(o.id)}
                  >
                    <span className="icon-tile">
                      <Navigation2 size={19} />
                    </span>
                    <span>
                      <strong>#{orderCode(o.id)}</strong>
                      <small>
                        {area(o.pickup_address)} → {area(o.dropoff_address)}
                      </small>
                      <Badge status={o.status} />
                    </span>
                    <ArrowRight size={16} />
                  </button>
                ))
              ) : (
                <Empty
                  title="No active deliveries"
                  description="Accepted deliveries appear here automatically."
                />
              )}
            </div>
          </Panel>
          <Panel className="tracking-map-panel">
            <DispatchMap riders={riders} order={order} tall />
            {order && (
              <div className="tracking-map-footer">
                <strong>#{orderCode(order.id)}</strong>
                <Badge status={order.status} />
                <Link className="text-link" to={`/admin/orders/${order.id}`}>
                  View details
                  <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </Panel>
        </div>
      </QueryBoundary>
    </>
  );
}
