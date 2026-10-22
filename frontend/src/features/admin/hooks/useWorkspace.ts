import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api';
export function useWorkspace() {
  return useQuery({
    queryKey: ['admin', 'workspace'],
    queryFn: async () => {
      const [orders, riders, users, analytics, reviews] = await Promise.all([
        adminApi.orders(),
        adminApi.riders(),
        adminApi.users(),
        adminApi.analytics(),
        adminApi.reviews(),
      ]);
      return { orders, riders, users, analytics, reviews };
    },
    refetchInterval: 15000,
  });
}
