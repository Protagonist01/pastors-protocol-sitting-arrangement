import { useQuery } from '@tanstack/react-query';
import { api } from '../services/apiClient';

export function useUser() {
  const userQuery = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const { data } = await api.get('/users/me');
      return data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    userQuery,
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    isError: userQuery.isError,
    refetch: userQuery.refetch,
  };
}
