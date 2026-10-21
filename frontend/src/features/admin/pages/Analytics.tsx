import { Package, CheckCheck, Timer, Star, Download } from 'lucide-react';
import { useWorkspace } from '../hooks/useWorkspace';
import { PageHeading, Stat, Panel, Button, Empty } from '../../../components/ui';
import { QueryBoundary } from '../../../components/feedback/QueryBoundary';
import { TrendChart, StatusChart } from '../components/OrderCharts';
import { completionRate, averageDuration, isActive } from '../../../lib/lifecycle';
import { exportCsv } from '../../../lib/exportCsv';
export default function Analytics() {
  const query = useWorkspace();
  const data = query.data;
  const orders = data?.orders ?? [];
  const rate = completionRate(orders),
    duration = averageDuration(orders);
  return (
    <>
      <PageHeading
        title="Operational analytics"
        description="Delivery performance, completion, and rider activity."
        actions={
          <Button
            variant="secondary"
            disabled={!data}
            onClick={() =>
              exportCsv('swiftdispatch-operations.csv', [
                ['Metric', 'Value'],
                ['Total orders', orders.length],
                ['Completion rate (%)', rate],
                ['Request-to-delivery average (minutes)', duration],
                ['Average customer rating', data!.analytics.average_rating],
              ])
            }
          >
            <Download size={17} />
            Export summary
          </Button>
        }
      />
      <QueryBoundary query={query}>
        {data && (
          <>
            <div className="stats-grid">
              <Stat label="Total deliveries" value={orders.length} icon={Package} tone="blue" />
              <Stat
                label="Completion rate"
                value={rate === null ? '—' : `${rate}%`}
                icon={CheckCheck}
                detail="Delivered / terminal orders"
              />
              <Stat
                label="Average delivery duration"
                value={duration === null ? '—' : `${duration} min`}
                icon={Timer}
                detail="Request to completed delivery"
              />
              <Stat
                label="Customer rating"
                value={data.analytics.average_rating?.toFixed(1) ?? '—'}
                icon={Star}
                tone="orange"
                detail={`${data.reviews.length} reviews`}
              />
            </div>
            <div className="chart-grid">
              <Panel
                title="Deliveries over time"
                subtitle="Request volume over the last seven days."
              >
                <TrendChart orders={orders} />
              </Panel>
              <Panel title="Order status distribution">
                <StatusChart orders={orders} />
              </Panel>
            </div>
            <Panel title="Rider activity" subtitle="Completed deliveries and current workload.">
              {data.riders.length ? (
                <div className="table-scroll">
                  <table className="responsive-table">
                    <thead>
                      <tr>
                        <th>Rider</th>
                        <th>Completed</th>
                        <th>Active deliveries</th>
                        <th>Customer rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.riders.map((r) => {
                        const name =
                          data.users.find((u) => u.id === r.user_id)?.full_name ?? `Rider #${r.id}`;
                        const reviews = data.reviews.filter((review) => review.rider_id === r.id);
                        return (
                          <tr key={r.id}>
                            <td data-label="Rider">{name}</td>
                            <td data-label="Completed">
                              {
                                orders.filter(
                                  (o) => o.rider_id === r.id && o.status === 'delivered',
                                ).length
                              }
                            </td>
                            <td data-label="Active">
                              {orders.filter((o) => o.rider_id === r.id && isActive(o)).length}
                            </td>
                            <td data-label="Rating">
                              {reviews.length
                                ? (
                                    reviews.reduce((s, v) => s + v.rating, 0) / reviews.length
                                  ).toFixed(1)
                                : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty
                  title="No rider activity yet"
                  description="Rider activity will appear as deliveries are assigned."
                />
              )}
            </Panel>
          </>
        )}
      </QueryBoundary>
    </>
  );
}
