import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../services/apiClient';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user) fetchProfile();
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user) fetchProfile();
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch profile via FastAPI — NOT directly from Supabase (per AGENT_CONTEXT.md §7.4)
  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/users/me');
      if (data) {
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (err) {
      // If 401 the interceptor will sign out, if 404 profile doesn't exist yet
      setProfile(null);
    }
    setLoading(false);
  };

  const reloadProfile = async () => {
    if (user) {
      await fetchProfile();
    }
  };

  const val = {
    session,
    user,
    profile,
    loading,
    reloadProfile,
    role: profile?.role || 'protocol',
    isEditorOrAdmin: profile?.role === 'admin' || profile?.role === 'editor'
  };

  return <AuthContext.Provider value={val}>{children}</AuthContext.Provider>;
}
