import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/apiClient';
import { supabase } from '../lib/supabase';

export function useDignitaries(sessionId) {
  const queryClient = useQueryClient();

  const dignitariesQuery = useQuery({
    queryKey: ['dignitaries', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      // Correct endpoint: GET /api/sessions/{session_id}/dignitaries (per AGENT_CONTEXT.md §6.4)
      const { data } = await api.get(`/sessions/${sessionId}/dignitaries`);
      return data;
    },
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (!sessionId) return;
    
    const channel = supabase.channel(`public:dignitaries:session_id=eq.${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dignitaries', filter: `session_id=eq.${sessionId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['dignitaries', sessionId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, queryClient]);

  const createDignitary = useMutation({
    mutationFn: async (data) => {
      // POST /api/sessions/{session_id}/dignitaries — session_id is in the URL
      const body = { ...data };
      delete body.session_id;
      const { data: result } = await api.post(`/sessions/${sessionId}/dignitaries`, body);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dignitaries', sessionId] });
    }
  });

  const updateDignitary = useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: result } = await api.patch(`/dignitaries/${id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dignitaries', sessionId] });
    }
  });

  const updateDignitaryStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      const { data: result } = await api.patch(`/dignitaries/${id}/status`, { status });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dignitaries', sessionId] });
    }
  });

  const deleteDignitary = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/dignitaries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dignitaries', sessionId] });
    }
  });

  return {
    dignitariesQuery,
    createDignitary,
    updateDignitary,
    updateDignitaryStatus,
    deleteDignitary,
  };
}
