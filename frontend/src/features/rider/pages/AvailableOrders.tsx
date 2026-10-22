import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Clock3, MapPin, Package, ArrowRight, RefreshCw } from 'lucide-react';
import { useNearbyRequests, useRiderProfile } from '../hooks/useRider';
import { riderApi } from '../api';
import type { NearbyDelivery } from '../../../types/rider';
import { ApiError } from '../../../lib/apiClient';
import { queryClient } from '../../../lib/queryClient';
import { usePolling } from '../../../hooks/usePolling';
import { Availability } from '../components/Availability';
import {
  PageHeading,
  Panel,
  Empty,
  Button,
  Feedback,
  Loading,
  ErrorState,
} from '../../../components/ui';
import { useFeedback } from '../../../components/feedback/OverlayProvider';
import { QueryBoundary } from '../../../components/feedback/QueryBoundary';
import { DispatchMap } from '../../../components/maps/DispatchMap';
import { orderCode, area, date } from '../../../lib/constants';
import { toDate } from '../../../lib/lifecycle';
export default function AvailableOrders() {
  const query = useNearbyRequests();
  const profile = useRiderProfile();
  const now = usePolling();
  const navigate = useNavigate();
  const feedback = useFeedback();
  const mutation = useMutation({
    mutationFn: async ({ reference, accept }: { reference: number; accept: boolean }) => {
      if (accept) {
        const order = await riderApi.accept(reference);
        feedback.toast('Delivery accepted. You’re ready to collect the package.');
        navigate(`/rider/orders/${order.id}`);
      } else {
        await riderApi.decline(reference);
        feedback.toast('Request declined.');
      }
    },
    onError: (error, variables) => {
      if (error instanceof ApiError && error.status === 409) {
        queryClient.setQueryData<NearbyDelivery[]>(['rider', 'requests'], (rows) =>
          rows?.filter((row) => row.requestId !== variables.reference),
        );
        feedback.toast(
          'This request is no longer available. Another rider may have accepted it.',
          'info',
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries();
    },
  });
  const requests =
    profile.data?.status === 'available'
      ? (query.data ?? []).filter((o) => toDate(o.expiresAt).getTime() > now)
      : [];
  if (profile.isPending) return <Loading />;
  if (profile.isError)
    return (
      <ErrorState
        error={profile.error}
        retry={() => {
          void profile.refetch();
        }}
      />
    );
  return (
    <>
      <PageHeading
        title="Nearby delivery requests"
        description="Available deliveries within your pickup radius. Updated every 5 seconds."
        actions={<Availability />}
      />
      <Feedback error={mutation.error?.message} />
      {profile.data?.status !== 'available' ? (
        <Panel>
          <Empty
            title={
              profile.data?.status === 'busy'
                ? 'You’re already on a delivery'
                : 'Go online to see nearby requests'
            }
            description={
              profile.data?.status === 'busy'
                ? 'Complete your active delivery before accepting another.'
                : 'Switch your availability to online when you’re ready to collect a package.'
            }
          />
        </Panel>
      ) : (
        <QueryBoundary query={query}>
          {requests.length ? (
            <div className="requests-grid">
              {requests.map((request) => (
                <Panel key={request.id} className="request-card">
                  <div className="request-heading">
                    <span className="icon-tile">
                      <Package size={22} />
                    </span>
                    <div>
                      <small>NEARBY DELIVERY</small>
                      <h2>#{orderCode(request.id)}</h2>
                    </div>
                    <span className="request-countdown">
                      <Clock3 size={15} />
                      {Math.max(0, Math.ceil((toDate(request.expiresAt).getTime() - now) / 1000))}s
                    </span>
                  </div>
                  <DispatchMap order={request} />
                  <div className="summary-route">
                    <div>
                      <MapPin size={19} />
                      <span>
                        <small>PICKUP</small>
                        <strong>{area(request.pickup_address)}</strong>
                      </span>
                    </div>
                    <div>
                      <MapPin size={19} />
                      <span>
                        <small>DROP-OFF</small>
                        <strong>{area(request.dropoff_address)}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="request-meta">
                    <p>
                      <Package size={16} />
                      {request.package_description ?? 'Parcel'}
                    </p>
                    <p>
                      <Clock3 size={16} />
                      Requested {date(request.created_at)}
                    </p>
                  </div>
                  <div className="request-actions">
                    <Button
                      variant="secondary"
                      disabled={mutation.isPending}
                      onClick={() =>
                        mutation.mutate({ reference: request.requestId, accept: false })
                      }
                    >
                      Decline
                    </Button>
                    <Button
                      disabled={mutation.isPending}
                      onClick={() =>
                        mutation.mutate({ reference: request.requestId, accept: true })
                      }
                    >
                      {mutation.isPending ? 'Updating…' : 'Accept delivery'}
                      <ArrowRight size={17} />
                    </Button>
                  </div>
                </Panel>
              ))}
            </div>
          ) : (
            <Panel>
              <Empty
                title="No nearby requests right now"
                description="New requests appear automatically. Expired or unavailable requests are hidden. An administrator can refresh an unanswered request."
                icon={Package}
                action={
                  <Button
                    variant="secondary"
                    disabled={query.isFetching}
                    onClick={() => {
                      void query.refetch();
                    }}
                  >
                    <RefreshCw size={16} />
                    Refresh requests
                  </Button>
                }
              />
            </Panel>
          )}
        </QueryBoundary>
      )}
    </>
  );
}
