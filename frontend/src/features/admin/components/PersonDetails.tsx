import { useFeedback } from '../../../components/feedback/OverlayProvider';
import { Link, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Mail, Phone, MapPin, ShieldCheck } from 'lucide-react';
import { useWorkspace } from '../hooks/useWorkspace';
import { adminApi } from '../api';
import { queryClient } from '../../../lib/queryClient';
import { PageHeading, Panel, Avatar, Badge, Button, Feedback, Empty } from '../../../components/ui';
import { OrderTable } from '../../../components/ui/OrderTable';
import { QueryBoundary } from '../../../components/feedback/QueryBoundary';
import { DispatchMap } from '../../../components/maps/DispatchMap';
export function PersonDetails({ kind }: { kind: 'riders' | 'customers' }) {
  const { id } = useParams();
  const feedback = useFeedback();
  const query = useWorkspace();
  const rider = query.data?.riders.find((r) => r.id === Number(id));
  const user = query.data?.users.find((u) =>
    kind === 'riders' ? u.id === rider?.user_id : u.id === Number(id) && u.role === 'customer',
  );
  const mutation = useMutation({
    mutationFn: () => adminApi.activate(user!.id, !user!.is_active),
    onSuccess: () => {
      feedback.toast('Account status updated.');
      void queryClient.invalidateQueries();
    },
  });
  const orders =
    query.data?.orders.filter((o) =>
      kind === 'riders' ? o.rider_id === rider?.id : o.customer_id === user?.id,
    ) ?? [];
  return (
    <>
      <Link to={`/admin/${kind}`} className="back-link">
        <ArrowLeft size={15} />
        All {kind}
      </Link>
      <PageHeading
        eyebrow="ACCOUNT DETAILS"
        title={user?.full_name ?? 'Account details'}
        description="Account information, current position, and delivery history."
      />
      <QueryBoundary query={query}>
        {user ? (
          <>
            <div className="profile-grid">
              <Panel>
                <div className="profile-cover" />
                <div className="profile-card">
                  <Avatar name={user.full_name} size="large" />
                  <h2>{user.full_name}</h2>
                  <p>{user.role} account</p>
                  <Badge status={rider?.status ?? (user.is_active ? 'available' : 'offline')} />
                  <dl className="profile-list">
                    <div>
                      <Mail size={16} />
                      <span>{user.email}</span>
                    </div>
                    <div>
                      <Phone size={16} />
                      <span>{user.phone ?? 'No phone added'}</span>
                    </div>
                    <div>
                      <MapPin size={16} />
                      <span>{user.address ?? 'Port Harcourt'}</span>
                    </div>
                    <div>
                      <ShieldCheck size={16} />
                      <span>{user.is_active ? 'Active account' : 'Inactive account'}</span>
                    </div>
                  </dl>
                  <Feedback error={mutation.error?.message} />
                  <Button
                    variant={user.is_active ? 'danger' : 'primary'}
                    disabled={mutation.isPending}
                    className="w-full"
                    onClick={async () => {
                      if (
                        await feedback.confirm({
                          title: `${user.is_active ? 'Deactivate' : 'Activate'} account?`,
                          description: `Update access for ${user.full_name}. Active delivery restrictions are enforced by the server.`,
                          action: user.is_active ? 'Deactivate' : 'Activate',
                          danger: user.is_active,
                        })
                      )
                        mutation.mutate();
                    }}
                  >
                    {mutation.isPending
                      ? 'Updating…'
                      : user.is_active
                        ? 'Deactivate account'
                        : 'Activate account'}
                  </Button>
                </div>
              </Panel>
              <Panel title="Their neighborhood" subtitle="Fixed demo location in Port Harcourt.">
                <DispatchMap
                  riders={rider ? [rider] : []}
                  point={
                    user.latitude !== null && user.longitude !== null
                      ? { latitude: user.latitude, longitude: user.longitude }
                      : undefined
                  }
                />
                <div className="person-stats">
                  <div>
                    <strong>{orders.length}</strong>
                    <span>Total deliveries</span>
                  </div>
                  <div>
                    <strong>{orders.filter((o) => o.status === 'delivered').length}</strong>
                    <span>Completed</span>
                  </div>
                  <div>
                    <strong>{orders.filter((o) => o.status === 'cancelled').length}</strong>
                    <span>Cancelled</span>
                  </div>
                </div>
              </Panel>
            </div>
            <Panel title="Delivery history">
              <OrderTable orders={orders} role="admin" users={query.data?.users} />
            </Panel>
          </>
        ) : (
          <Panel>
            <Empty
              title="Account not found"
              description="This account may no longer be available."
            />
          </Panel>
        )}
      </QueryBoundary>
    </>
  );
}
