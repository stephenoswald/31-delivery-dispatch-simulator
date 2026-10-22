import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard, ShieldCheck } from 'lucide-react';
import { customerApi } from '../api';
import { PageHeading, Panel, Button, Feedback } from '../../../components/ui';
import { QueryBoundary } from '../../../components/feedback/QueryBoundary';
import { money, orderCode, date } from '../../../lib/constants';
export default function Payment() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const cache = useQueryClient();
  const order = useQuery({
    queryKey: ['customer', 'order', id],
    queryFn: () => customerApi.order(id),
  });
  const payment = useMutation({
    mutationFn: (outcome: 'success' | 'failed') => customerApi.pay(id, outcome),
    onSuccess: async (updated) => {
      cache.setQueryData(['customer', 'order', id], updated);
      await cache.invalidateQueries();
      navigate(`/customer/orders/${id}/tracking`);
    },
    onError: () => {
      void cache.invalidateQueries({ queryKey: ['customer', 'order', id] });
    },
  });
  const data = order.data;
  return (
    <>
      <Link className="back-link" to={`/customer/orders/${id}`}>
        Back to delivery
      </Link>
      <PageHeading
        title="Delivery payment"
        description="Pay the simulated fee before your request becomes available to riders."
      />
      <Panel title={data ? `Order ${orderCode(data.id)}` : 'Payment summary'}>
        <QueryBoundary query={order}>
          {data && (
            <div className="payment-checkout">
              <span className="icon-tile">
                <CreditCard size={24} />
              </span>
              <p>
                {data.pickup_address} → {data.dropoff_address}
              </p>
              <dl className="payment-breakdown">
                <div>
                  <dt>Straight-line distance</dt>
                  <dd>{data.distance_km.toFixed(2)} km</dd>
                </div>
                <div>
                  <dt>
                    {data.payment_status === 'paid' && !data.payment_reference
                      ? 'Existing request'
                      : 'Base fare'}
                  </dt>
                  <dd>
                    {data.payment_status === 'paid' && !data.payment_reference
                      ? 'Payment not required'
                      : '₦500.00'}
                  </dd>
                </div>
                <div>
                  <dt>Distance rate</dt>
                  <dd>₦100.00/km</dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>
                    <strong>{money(data.delivery_fee_minor, data.currency)}</strong>
                  </dd>
                </div>
              </dl>
              <p className="payment-simulation">
                <ShieldCheck size={18} /> Simulation only. No real money or card details are
                required.
              </p>
              <Feedback error={payment.error?.message} />
              {data.status === 'cancelled' ? (
                <p>This delivery was cancelled and cannot be paid for.</p>
              ) : data.payment_status === 'paid' ? (
                <>
                  <h2>Payment complete</h2>
                  <p>
                    {data.payment_reference
                      ? `Receipt: ${data.payment_reference}`
                      : 'Existing request — payment was not required.'}
                  </p>
                  {data.paid_at && <p>{date(data.paid_at)}</p>}
                  <Link className="button button-primary" to={`/customer/orders/${id}/tracking`}>
                    Track delivery
                  </Link>
                </>
              ) : (
                <>
                  <Button disabled={payment.isPending} onClick={() => payment.mutate('success')}>
                    {payment.isPending
                      ? 'Processing…'
                      : `Pay ${money(data.delivery_fee_minor)} (simulated)`}
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={payment.isPending}
                    onClick={() => payment.mutate('failed')}
                  >
                    Simulate failed payment
                  </Button>
                  <p className="muted small">
                    If payment fails or you leave this page, your order stays unpaid. You can return
                    and retry.
                  </p>
                </>
              )}
            </div>
          )}
        </QueryBoundary>
      </Panel>
    </>
  );
}
