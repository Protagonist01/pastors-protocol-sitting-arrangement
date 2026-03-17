import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/apiClient';

/* ── List sessions for a conference ── */
export function useSessions(confId) {
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: ['sessions', confId],
    queryFn: async () => {
      if (!confId) return [];
      const { data } = await api.get(`/sessions/${confId}`);
      return data;
    },
    enabled: !!confId,
  });

  const createSession = useMutation({
    mutationFn: async (newSess) => {
      const { data } = await api.post('/sessions/', newSess);
      return data;
    },
    onSuccess: () => {
      if (confId) queryClient.invalidateQueries({ queryKey: ['sessions', confId] });
      queryClient.invalidateQueries({ queryKey: ['conferences'] });
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
    createSession,
    deleteSession,
  };
}

/* ── Fetch a single session's data by ID (separate hook to respect Rules of Hooks) ── */
export function useSessionData(sessionId) {
  return useQuery({
    queryKey: ['sessionData', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
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
}
