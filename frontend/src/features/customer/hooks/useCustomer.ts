import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../api';
export const useCustomerOrders = () =>
  useQuery({
    queryKey: ['customer', 'orders'],
    queryFn: customerApi.orders,
    refetchInterval: 10000,
  });
export const useCustomerOrder = (id: number) =>
  useQuery({
    queryKey: ['customer', 'order', id],
    queryFn: () => customerApi.order(id),
    refetchInterval: 5000,
  });
