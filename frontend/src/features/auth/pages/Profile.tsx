import { useQuery } from '@tanstack/react-query';
import { MapPin, Mail, Phone, ShieldCheck, Bike, Star } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { Avatar, PageHeading, Panel, Badge, Feedback } from '../../../components/ui';
import { riderApi } from '../../rider/api';
import { date } from '../../../lib/constants';
export default function Profile() {
  const { user } = useAuth();
  const profile = useQuery({
    queryKey: ['rider', 'profile'],
    queryFn: riderApi.profile,
    enabled: user?.role === 'rider',
  });
  const reviews = useQuery({
    queryKey: ['rider', 'reviews'],
    queryFn: riderApi.reviews,
    enabled: user?.role === 'rider',
  });
  const rating = reviews.data?.length
    ? (reviews.data.reduce((s, r) => s + r.rating, 0) / reviews.data.length).toFixed(1)
    : 'Not yet rated';
  return (
    <>
      <PageHeading title="My profile" description="Your account and delivery information." />
      <div className="profile-grid">
        <Panel>
          <div className="profile-cover" />
          <div className="profile-card">
            <Avatar name={user!.full_name} size="large" />
            <h2>{user!.full_name}</h2>
            <p>{user!.role} account</p>
            <Badge status={profile.data?.status ?? (user!.is_active ? 'available' : 'offline')} />
            <dl className="profile-list">
              <div>
                <Mail size={18} />
                <span>{user!.email}</span>
              </div>
              <div>
                <Phone size={18} />
                <span>{user!.phone ?? 'Not provided'}</span>
              </div>
              <div>
                <MapPin size={18} />
                <span>{user!.address ?? user!.zone ?? 'Not provided'}</span>
              </div>
              <div>
                <ShieldCheck size={18} />
                <span>Member since {date(user!.created_at, true)}</span>
              </div>
            </dl>
          </div>
        </Panel>
        <div>
          <Panel title="Account details">
            <dl className="read-only-details">
              <div>
                <dt>Account ID</dt>
                <dd>#{user!.id}</dd>
              </div>
              <div>
                <dt>Account role</dt>
                <dd>{user!.role}</dd>
              </div>
              <div>
                <dt>Delivery zone</dt>
                <dd>{user!.zone ?? 'Port Harcourt'}</dd>
              </div>
              <div>
                <dt>Account status</dt>
                <dd>{user!.is_active ? 'Active' : 'Inactive'}</dd>
              </div>
              <div>
                <dt>Fixed coordinates</dt>
                <dd>
                  {user!.latitude !== null
                    ? `${user!.latitude}, ${user!.longitude}`
                    : 'Not provided'}
                </dd>
              </div>
            </dl>
          </Panel>
          {user!.role === 'rider' && (
            <Panel title="Rider information">
              <dl className="read-only-details">
                <div>
                  <dt>
                    <Bike size={17} />
                    Vehicle
                  </dt>
                  <dd>{profile.data?.vehicle_type ?? 'Not provided'}</dd>
                </div>
                <div>
                  <dt>
                    <Star size={17} />
                    Customer rating
                  </dt>
                  <dd>{rating}</dd>
                </div>
                <div>
                  <dt>Availability</dt>
                  <dd>{profile.data ? <Badge status={profile.data.status} /> : 'Loading…'}</dd>
                </div>
              </dl>
              <Feedback error={profile.error?.message ?? reviews.error?.message} />
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
