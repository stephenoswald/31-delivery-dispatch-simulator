import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { useWorkspace } from '../hooks/useWorkspace';
import { PageHeading, Panel, Button, Empty } from '../../../components/ui';
import { QueryBoundary } from '../../../components/feedback/QueryBoundary';
import { exportCsv } from '../../../lib/exportCsv';
import { dayKey, isActive, isPending, averageDuration } from '../../../lib/lifecycle';
export default function Reports() {
  const query = useWorkspace();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const invalid = !!from && !!to && from > to;
  const orders =
    query.data?.orders.filter(
      (o) => (!from || dayKey(o.created_at) >= from) && (!to || dayKey(o.created_at) <= to),
    ) ?? [];
  const days = [...new Set(orders.map((o) => dayKey(o.created_at)))].sort().reverse();
  const rows = days.map((day) => {
    const items = orders.filter((o) => dayKey(o.created_at) === day);
    return {
      day,
      total: items.length,
      completed: items.filter((o) => o.status === 'delivered').length,
      cancelled: items.filter((o) => o.status === 'cancelled').length,
      pending: items.filter(isPending).length,
      active: items.filter(isActive).length,
      duration: averageDuration(items),
    };
  });
  return (
    <>
      <PageHeading
        title="Reports"
        description="Generate a daily operational report from actual delivery records."
        actions={
          <Button
            disabled={invalid || !rows.length}
            onClick={() =>
              exportCsv('swiftdispatch-daily-report.csv', [
                [
                  'Date (Lagos)',
                  'Orders',
                  'Pending',
                  'Active',
                  'Delivered',
                  'Cancelled',
                  'Avg request-to-delivery minutes',
                ],
                ...rows.map((r) => [
                  r.day,
                  r.total,
                  r.pending,
                  r.active,
                  r.completed,
                  r.cancelled,
                  r.duration,
                ]),
              ])
            }
          >
            <Download size={17} />
            Export report
          </Button>
        }
      />
      <Panel
        title="Daily delivery report"
        subtitle="Dates are based on when the request was created."
      >
        <div className="report-filters">
          <label>
            From
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              max={to || undefined}
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              min={from || undefined}
            />
          </label>
          <Button
            variant="secondary"
            onClick={() => {
              setFrom('');
              setTo('');
            }}
          >
            Clear dates
          </Button>
        </div>
        {invalid ? (
          <p className="form-error" role="alert">
            End date must be on or after start date.
          </p>
        ) : (
          <QueryBoundary query={query}>
            {rows.length ? (
              <div className="table-scroll">
                <table className="responsive-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Total orders</th>
                      <th>Pending</th>
                      <th>Active</th>
                      <th>Delivered</th>
                      <th>Cancelled</th>
                      <th>Avg duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.day}>
                        <td data-label="Date">{r.day}</td>
                        <td data-label="Total">{r.total}</td>
                        <td data-label="Pending">{r.pending}</td>
                        <td data-label="Active">{r.active}</td>
                        <td data-label="Delivered">{r.completed}</td>
                        <td data-label="Cancelled">{r.cancelled}</td>
                        <td data-label="Avg duration">
                          {r.duration === null ? '—' : `${r.duration} min`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty
                icon={FileText}
                title="No records for this period"
                description="Choose another date range or create a delivery to begin collecting reports."
              />
            )}
          </QueryBoundary>
        )}
      </Panel>
    </>
  );
}
