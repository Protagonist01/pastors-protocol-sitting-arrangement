import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/apiClient';

/* ── List sessions for a conference ── */
export function useSessions(confId) {
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: ['sessions', confId],
    queryFn: async () => {
      if (!confId) return [];
      const { data } = await api.get(`/conferences/${confId}/sessions`);
      return data;
    },
    enabled: !!confId,
  });

  const createSession = useMutation({
    mutationFn: async (newSess) => {
      const { data } = await api.post(`/conferences/${confId}/sessions`, newSess);
      return data;
    },
    onSuccess: () => {
      if (confId) queryClient.invalidateQueries({ queryKey: ['sessions', confId] });
      queryClient.invalidateQueries({ queryKey: ['conferences'] });
    }
  });

  const updateSession = useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: result } = await api.patch(`/sessions/${id}`, data);
      return result;
    },
    onSuccess: () => {
      if (confId) queryClient.invalidateQueries({ queryKey: ['sessions', confId] });
    }
  });

  const updateSeatingConfig = useMutation({
    mutationFn: async ({ sessionId, config }) => {
      const { data } = await api.patch(`/sessions/${sessionId}/seating-config`, config);
      return data;
    },
    onSuccess: () => {
      if (confId) queryClient.invalidateQueries({ queryKey: ['sessions', confId] });
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
    updateSession,
    updateSeatingConfig,
    deleteSession,
  };
}

/* ── Fetch a single session by ID ── */
export function useSession(sessionId) {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const { data } = await api.get(`/sessions/${sessionId}`);
      return data;
    },
    enabled: !!sessionId,
  });
}

/* ── Fetch session data + parent conference (efficient: 2 API calls max) ── */
export function useSessionData(sessionId) {
  return useQuery({
    queryKey: ['sessionData', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      // Fetch the session directly via GET /api/sessions/{id}
      const { data: session } = await api.get(`/sessions/${sessionId}`);
      if (!session) return null;
      // Fetch the parent conference
      const { data: conf } = await api.get(`/conferences/${session.conference_id}`);
      return { session, conf };
    },
    enabled: !!sessionId,
  });
}
