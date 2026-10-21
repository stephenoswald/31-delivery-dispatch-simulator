import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Bike, Users, UserCheck, MapPin, Star } from 'lucide-react';
import { useWorkspace } from '../hooks/useWorkspace';
import { PageHeading, Panel, Stat, Avatar, Badge, Empty } from '../../../components/ui';
import { QueryBoundary } from '../../../components/feedback/QueryBoundary';
import { isActive } from '../../../lib/lifecycle';
export function Directory({ kind }: { kind: 'riders' | 'customers' }) {
  const query = useWorkspace();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [vehicle, setVehicle] = useState('all');
  const [page, setPage] = useState(0);
  const riders = kind === 'riders';
  const data = query.data;
  const users = data?.users.filter((u) => u.role === (riders ? 'rider' : 'customer')) ?? [];
  const filtered = users.filter((u) => {
    const profile = data?.riders.find((r) => r.user_id === u.id);
    return (
      `${u.full_name} ${u.email} ${u.phone ?? ''} ${u.address ?? ''}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (status === 'all' ||
        (riders ? profile?.status === status : status === (u.is_active ? 'active' : 'inactive'))) &&
      (vehicle === 'all' || profile?.vehicle_type === vehicle)
    );
  });
  const maxPage = Math.max(1, Math.ceil(filtered.length / 8));
  const current = Math.min(page, maxPage - 1);
  const rows = filtered.slice(current * 8, current * 8 + 8);
  return (
    <>
      <PageHeading
        title={riders ? 'Riders management' : 'Customers management'}
        description={
          riders
            ? 'Manage rider availability, current workload, and delivery performance.'
            : 'Search customer accounts and review their delivery history.'
        }
      />
      <QueryBoundary query={query}>
        <div className="stats-grid stats-three">
          <Stat
            label={riders ? 'Total riders' : 'Total customers'}
            value={users.length}
            icon={riders ? Bike : Users}
            tone="blue"
          />
          <Stat
            label={riders ? 'Available riders' : 'Active accounts'}
            value={
              riders
                ? data?.riders.filter((r) => r.status === 'available').length
                : users.filter((u) => u.is_active).length
            }
            icon={UserCheck}
          />
          <Stat
            label={riders ? 'Riders on delivery' : 'With a saved location'}
            value={
              riders
                ? data?.riders.filter((r) => r.status === 'busy').length
                : users.filter((u) => u.latitude !== null).length
            }
            icon={MapPin}
            tone="orange"
          />
        </div>
        <Panel>
          <div className="status-tabs" role="group" aria-label="Filter accounts">
            {(riders ? ['all', 'available', 'busy', 'offline'] : ['all', 'active', 'inactive']).map(
              (s) => (
                <button
                  key={s}
                  aria-pressed={status === s}
                  className={status === s ? 'active' : ''}
                  onClick={() => {
                    setStatus(s);
                    setPage(0);
                  }}
                >
                  {s === 'all'
                    ? 'All'
                    : s === 'busy'
                      ? 'On delivery'
                      : s[0].toUpperCase() + s.slice(1)}
                </button>
              ),
            )}
          </div>
          <div className="table-tools">
            <div className="input-icon search-input">
              <Search size={18} />
              <input
                aria-label="Search people"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Search name, email, phone or neighborhood…"
              />
            </div>
            {riders && (
              <label className="filter-select">
                <span className="sr-only">Vehicle filter</span>
                <select
                  value={vehicle}
                  onChange={(e) => {
                    setVehicle(e.target.value);
                    setPage(0);
                  }}
                >
                  <option value="all">All vehicles</option>
                  {[...new Set(data?.riders.map((r) => r.vehicle_type).filter(Boolean))].map(
                    (v) => (
                      <option value={v!} key={v}>
                        {v}
                      </option>
                    ),
                  )}
                </select>
              </label>
            )}
          </div>
          {rows.length ? (
            <>
              <div className="table-scroll">
                <table className="responsive-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone / neighborhood</th>
                      <th>{riders ? 'Vehicle' : 'Deliveries'}</th>
                      <th>Status</th>
                      {riders && (
                        <>
                          <th>Rating</th>
                          <th>Active delivery</th>
                        </>
                      )}
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((u) => {
                      const rider = data?.riders.find((r) => r.user_id === u.id);
                      const reviews = data?.reviews.filter((r) => r.rider_id === rider?.id) ?? [];
                      const active = data?.orders.find(
                        (o) => o.rider_id === rider?.id && isActive(o),
                      );
                      return (
                        <tr key={u.id}>
                          <td data-label="Name">
                            <div className="person-cell">
                              <Avatar name={u.full_name} />
                              <span>
                                <strong>{u.full_name}</strong>
                                <small>{u.email}</small>
                              </span>
                            </div>
                          </td>
                          <td data-label="Contact">
                            <span className="route-cell">
                              <strong>{u.phone ?? 'Not provided'}</strong>
                              <small>{u.address ?? 'No address provided'}</small>
                            </span>
                          </td>
                          <td data-label={riders ? 'Vehicle' : 'Deliveries'}>
                            {riders
                              ? (rider?.vehicle_type ?? '—')
                              : data?.orders.filter((o) => o.customer_id === u.id).length}
                          </td>
                          <td data-label="Status">
                            {riders ? (
                              <Badge status={rider?.status ?? 'offline'} />
                            ) : (
                              <span
                                className={`badge ${u.is_active ? 'badge-available' : 'badge-offline'}`}
                              >
                                <i />
                                {u.is_active ? 'Active' : 'Inactive'}
                              </span>
                            )}
                          </td>
                          {riders && (
                            <>
                              <td data-label="Rating">
                                <span className="rating-inline">
                                  <Star size={14} />
                                  {reviews.length
                                    ? (
                                        reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
                                      ).toFixed(1)
                                    : '—'}
                                </span>
                              </td>
                              <td data-label="Active delivery">
                                {active ? (
                                  <Link className="text-link" to={`/admin/orders/${active.id}`}>
                                    View delivery
                                    <ArrowRight size={13} />
                                  </Link>
                                ) : (
                                  'None'
                                )}
                              </td>
                            </>
                          )}
                          <td data-label="Action">
                            {!riders || rider ? (
                              <Link
                                className="row-link"
                                to={`/admin/${kind}/${riders ? rider!.id : u.id}`}
                              >
                                View
                                <ArrowRight size={14} />
                              </Link>
                            ) : (
                              <span className="muted">No rider profile</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="pagination">
                <span>
                  {filtered.length} {kind}
                </span>
                <div>
                  <button disabled={current === 0} onClick={() => setPage(current - 1)}>
                    Previous
                  </button>
                  <span>
                    {current + 1} / {maxPage}
                  </span>
                  <button disabled={current + 1 === maxPage} onClick={() => setPage(current + 1)}>
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : (
            <Empty
              title="No matching accounts"
              description="Try a different search, vehicle, or availability filter."
            />
          )}
        </Panel>
        <p className="directory-footnote">
          Phone numbers are synthetic demo identifiers. No messaging or calling service is
          connected.
        </p>
      </QueryBoundary>
    </>
  );
}
