import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/apiClient';

export function useSessions(confId) {
  const queryClient = useQueryClient();

  // Queries
  const sessionsQuery = useQuery({
    queryKey: ['sessions', confId],
    queryFn: async () => {
      if (!confId) return [];
      const { data } = await api.get(`/sessions/${confId}`);
      return data;
    },
    enabled: !!confId,
  });

  // Helper to fetch session info (find it within a conference)
  // Note: Backend might need a direct GET /sessions/{id} endpoint later
  const sessionDataQuery = (sessionId) => useQuery({
    queryKey: ['sessionData', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      // Because we lack a GET /sessions/{id} backend endpoint currently,
      // we scan conferences. For production, add `GET /sessions/{session_id}` in FastAPI.
      const { data: confs } = await api.get('/conferences/');
      for (const conf of confs) {
        const { data: sData } = await api.get(`/sessions/${conf.id}`);
        const sess = sData.find(s => s.id === sessionId);
        if (sess) return { session: sess, conf };
      }
      return null;
    },
    enabled: !!sessionId,
  });

  // Mutations
  const createSession = useMutation({
    mutationFn: async (newSess) => {
      const { data } = await api.post('/sessions/', newSess);
      return data;
    },
    onSuccess: () => {
      if (confId) queryClient.invalidateQueries({ queryKey: ['sessions', confId] });
      queryClient.invalidateQueries({ queryKey: ['conferences'] }); // to update sess count
    }
  });

  const deleteSession = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/sessions/${id}`);
    },
    onSuccess: () => {
      if (confId) queryClient.invalidateQueries({ queryKey: ['sessions', confId] });
      queryClient.invalidateQueries({ queryKey: ['conferences'] });
    }
  });

  return {
    sessionsQuery,
    sessionDataQuery,
    createSession,
    deleteSession,
  };
}
