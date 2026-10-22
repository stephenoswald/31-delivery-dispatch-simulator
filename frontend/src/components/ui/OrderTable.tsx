import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Search, Package, ArrowUpDown } from 'lucide-react';
import type { Order } from '../../types/order';
import type { Role, User } from '../../types/user';
import { Badge, Empty, Avatar } from './index';
import { area, date, orderCode } from '../../lib/constants';
import { phase, isTerminal } from '../../lib/lifecycle';
export function OrderTable({
  orders,
  role,
  users = [],
  compact = false,
  history = false,
}: {
  orders: Order[];
  role: Role;
  users?: User[];
  compact?: boolean;
  history?: boolean;
}) {
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(0);
  const [oldest, setOldest] = useState(false);
  useEffect(() => {
    setSearch(params.get('q') ?? '');
    setPage(0);
  }, [params]);
  const source = history ? orders.filter(isTerminal) : orders;
  const tabs = history
    ? [
        ['all', 'All deliveries'],
        ['delivered', 'Delivered'],
        ['cancelled', 'Cancelled'],
        ['expired', 'Expired'],
      ]
    : [
        ['all', 'All orders'],
        ['pending', 'Pending'],
        ['active', 'Active'],
        ['delivered', 'Delivered'],
        ['cancelled', 'Cancelled'],
        ['expired', 'Expired'],
      ];
  const filtered = source
    .filter((o) => {
      const customer = users.find((u) => u.id === o.customer_id);
      return (
        (status === 'all' ||
          (status === 'active'
            ? ['accepted', 'picked_up'].includes(phase(o.status))
            : phase(o.status) === status)) &&
        `${orderCode(o.id)} ${o.tracking_code} ${o.pickup_address} ${o.dropoff_address} ${o.recipient_name} ${customer?.full_name ?? ''}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    })
    .sort((a, b) => (oldest ? a.id - b.id : b.id - a.id));
  const pages = Math.max(1, Math.ceil(filtered.length / 8));
  const current = Math.min(page, pages - 1);
  const rows = compact ? filtered.slice(0, 5) : filtered.slice(current * 8, current * 8 + 8);
  return (
    <>
      {!compact && (
        <>
          <div className="status-tabs" role="group" aria-label="Filter orders">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                aria-pressed={status === key}
                className={status === key ? 'active' : ''}
                onClick={() => {
                  setStatus(key);
                  setPage(0);
                }}
              >
                {label}
                <span>
                  {key === 'all'
                    ? source.length
                    : source.filter((o) =>
                        key === 'active'
                          ? ['accepted', 'picked_up'].includes(phase(o.status))
                          : phase(o.status) === key,
                      ).length}
                </span>
              </button>
            ))}
          </div>
          <div className="table-tools">
            <div className="input-icon search-input">
              <Search size={18} />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Search order, customer or route…"
                aria-label="Search orders"
              />
            </div>
            <button
              className="button button-secondary"
              aria-label={oldest ? 'Sort newest first' : 'Sort oldest first'}
              onClick={() => setOldest(!oldest)}
            >
              <ArrowUpDown size={16} />
              <span>{oldest ? 'Oldest first' : 'Newest first'}</span>
            </button>
          </div>
        </>
      )}
      {rows.length ? (
        <>
          <div className={`table-scroll ${compact ? 'compact-table' : ''}`}>
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  {role === 'admin' && <th>Customer</th>}
                  <th>Pickup → Drop-off</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => {
                  const user = users.find((u) => u.id === o.customer_id);
                  return (
                    <tr key={o.id}>
                      <td data-label="Order">
                        <Link className="order-cell" to={`/${role}/orders/${o.id}`}>
                          <span className={`order-icon order-icon-${o.status}`}>
                            <Package size={18} />
                          </span>
                          <strong>#{orderCode(o.id)}</strong>
                        </Link>
                      </td>
                      {role === 'admin' && (
                        <td data-label="Customer">
                          <span className="person-cell">
                            <Avatar name={user?.full_name ?? 'Customer'} />
                            {user?.full_name ?? `Customer #${o.customer_id}`}
                          </span>
                        </td>
                      )}
                      <td data-label="Route">
                        <span className="route-cell">
                          <span>
                            {area(o.pickup_address)}
                            <ArrowRight size={13} />
                            {area(o.dropoff_address)}
                          </span>
                          <small>{o.recipient_name}</small>
                        </span>
                      </td>
                      <td data-label="Status">
                        <Badge status={o.status} />
                        {o.payment_status === 'unpaid' && o.status === 'pending' && (
                          <p className="muted small">Payment required</p>
                        )}
                      </td>
                      <td data-label="Requested" className="muted small">
                        {date(o.created_at)}
                      </td>
                      <td data-label="Action">
                        <Link
                          className="row-link"
                          to={
                            role === 'customer' &&
                            o.payment_status === 'unpaid' &&
                            o.status === 'pending'
                              ? `/customer/orders/${o.id}/payment`
                              : `/${role}/orders/${o.id}`
                          }
                          aria-label={`${role === 'customer' && o.payment_status === 'unpaid' && o.status === 'pending' ? 'Pay for' : 'View'} order ${orderCode(o.id)}`}
                        >
                          {role === 'customer' &&
                          o.payment_status === 'unpaid' &&
                          o.status === 'pending'
                            ? 'Pay now'
                            : 'View'}
                          <ArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!compact && (
            <div className="pagination">
              <span>
                Showing {current * 8 + 1}–{Math.min(current * 8 + 8, filtered.length)} of{' '}
                {filtered.length}
              </span>
              <div>
                <button disabled={current === 0} onClick={() => setPage(current - 1)}>
                  Previous
                </button>
                <span>
                  {current + 1} / {pages}
                </span>
                <button disabled={current + 1 === pages} onClick={() => setPage(current + 1)}>
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <Empty
          title={orders.length ? 'No matching deliveries' : 'No deliveries yet'}
          description={
            orders.length
              ? 'Try a different search or status filter.'
              : 'Your deliveries will appear here once a request is created.'
          }
          action={
            role === 'customer' ? (
              <Link to="/customer/new" className="button button-primary">
                Create delivery
                <ArrowRight size={16} />
              </Link>
            ) : undefined
          }
        />
      )}
    </>
  );
}
