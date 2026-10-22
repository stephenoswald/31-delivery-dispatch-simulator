import { phase, toDate } from '../../../lib/lifecycle';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { Order } from '../../../types/order';
import { STATUS_LABELS } from '../../../lib/constants';
const COLORS: Record<string, string> = {
  pending: '#f3a62c',
  accepted: '#277cf2',
  picked_up: '#6c63d9',
  delivered: '#009b70',
  cancelled: '#ed5664',
  expired: '#8b72ac',
};
export function TrendChart({ orders }: { orders: Order[] }) {
  const data = Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - 6 + i);
    const key = day.toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
    return {
      day: day.toLocaleDateString('en-GB', {
        timeZone: 'Africa/Lagos',
        day: 'numeric',
        month: 'short',
      }),
      orders: orders.filter(
        (o) =>
          toDate(o.created_at).toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' }) === key,
      ).length,
    };
  });
  return (
    <div
      className="chart-container"
      role="img"
      aria-label="Delivery requests over the last seven days"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 18, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#008467" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#008467" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#edf0ec" strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#81918a' }}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#81918a' }}
            domain={[0, 'auto']}
          />
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e4eae4', fontSize: 12 }} />
          <Area
            type="monotone"
            name="Deliveries"
            dataKey="orders"
            stroke="#008467"
            strokeWidth={3}
            fill="url(#chartFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export function StatusChart({ orders }: { orders: Order[] }) {
  const statuses = [...new Set(orders.map((o) => phase(o.status)))];
  const data = statuses.map((status) => ({
    name: STATUS_LABELS[status],
    value: orders.filter((o) => phase(o.status) === status).length,
    color: COLORS[status],
  }));
  return (
    <div className="status-chart">
      <div className="donut-wrap">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={3}
                stroke="none"
              >
                {data.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-donut" />
        )}
        <div className="donut-label">
          <strong>{orders.length}</strong>
          <span>deliveries</span>
        </div>
      </div>
      <div className="chart-legend">
        {data.length ? (
          data.map((d) => (
            <div key={d.name}>
              <i style={{ background: d.color }} />
              <span>{d.name}</span>
              <strong>{d.value}</strong>
            </div>
          ))
        ) : (
          <p className="muted small">
            Your delivery mix will
            <br />
            appear here.
          </p>
        )}
      </div>
    </div>
  );
}
