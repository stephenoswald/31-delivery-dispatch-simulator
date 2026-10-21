import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../hooks/useAuth';
import { riderApi } from '../api';
export const useRiderOrders = () =>
  useQuery({
    queryKey: ['rider', 'orders'],
    queryFn: riderApi.orders,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });
export const useRiderProfile = () =>
  useQuery({
    queryKey: ['rider', 'profile'],
    queryFn: riderApi.profile,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });
export function useNearbyRequests() {
  const { user } = useAuth();
  const profile = useRiderProfile();
  return useQuery({
    queryKey: ['rider', 'requests'],
    queryFn: riderApi.requests,
    enabled: user?.role === 'rider' && profile.data?.status === 'available',
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });
}
