import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/apiClient';
import { supabase } from '../lib/supabase';

export function useAttendees(sessionId) {
  const queryClient = useQueryClient();

  // Queries
  const attendeesQuery = useQuery({
    queryKey: ['attendees', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data } = await api.get(`/attendees/${sessionId}`);
      return data;
    },
    enabled: !!sessionId,
  });

  // Supabase Real-time Subscription binding
  useEffect(() => {
    if (!sessionId) return;
    
    // Subscribe to changes on the specific session
    const channel = supabase.channel(`public:attendees:session_id=eq.${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendees', filter: `session_id=eq.${sessionId}` }, () => {
        // Invalidate the query to fetch fresh data whenever an attendee changes in this session
        queryClient.invalidateQueries({ queryKey: ['attendees', sessionId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, queryClient]);

  // Mutations
  const createAttendee = useMutation({
    mutationFn: async (data) => {
      const { data: result } = await api.post('/attendees/', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendees', sessionId] });
    }
  });

  const updateAttendee = useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: result } = await api.patch(`/attendees/${id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendees', sessionId] });
    }
  });

  const updateAttendeeStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      const { data: result } = await api.patch(`/attendees/${id}/status`, { status });
      return result;
    },
    onSuccess: () => {
      // Invalidate to make sure the general list refreshes, 
      // but optimistic updates can also be applied here for instant UI feedback.
      queryClient.invalidateQueries({ queryKey: ['attendees', sessionId] });
    }
  });

  const deleteAttendee = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/attendees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendees', sessionId] });
    }
  });

  return {
    attendeesQuery,
    createAttendee,
    updateAttendee,
    updateAttendeeStatus,
    deleteAttendee,
  };
}
