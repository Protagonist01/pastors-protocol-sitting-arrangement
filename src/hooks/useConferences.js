import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/apiClient';

/* ── List all conferences ── */
export function useConferences() {
  const queryClient = useQueryClient();

  const conferencesQuery = useQuery({
    queryKey: ['conferences'],
    queryFn: async () => {
      const { data } = await api.get('/conferences/');
      return data;
    }
  });

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
    createConference,
    updateConference,
    deleteConference,
  };
}

/* ── Fetch a single conference by ID (separate hook to respect Rules of Hooks) ── */
export function useConference(confId) {
  return useQuery({
    queryKey: ['conference', confId],
    queryFn: async () => {
      if (!confId) return null;
      const { data } = await api.get(`/conferences/${confId}`);
      return data;
    },
    enabled: !!confId,
  });
}
