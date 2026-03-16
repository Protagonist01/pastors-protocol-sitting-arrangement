import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/apiClient';

export function useConferences() {
  const queryClient = useQueryClient();

  // Queries
  const conferencesQuery = useQuery({
    queryKey: ['conferences'],
    queryFn: async () => {
      const { data } = await api.get('/conferences/');
      return data;
    }
  });

  const conferenceQuery = (confId) => useQuery({
    queryKey: ['conference', confId],
    queryFn: async () => {
      if (!confId) return null;
      const { data } = await api.get(`/conferences/${confId}`);
      return data;
    },
    enabled: !!confId,
  });

  // Mutations
  const createConference = useMutation({
    mutationFn: async (newConf) => {
      const { data } = await api.post('/conferences/', newConf);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conferences'] });
    }
  });

  const updateConference = useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: result } = await api.patch(`/conferences/${id}`, data);
      return result;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['conferences'] });
      queryClient.invalidateQueries({ queryKey: ['conference', id] });
    }
  });

  const deleteConference = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/conferences/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conferences'] });
    }
  });

  return {
    conferencesQuery,
    conferenceQuery,
    createConference,
    updateConference,
    deleteConference,
  };
}
