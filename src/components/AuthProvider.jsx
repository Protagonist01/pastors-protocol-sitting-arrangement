import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
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
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    console.log('Fetching profile for userId:', userId);
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    console.log('Profile fetch result:', { data, error });
    if (!error && data) {
      setProfile(data);
    } else {
      console.error('Profile fetch error:', error);
      setProfile(null);
    }
    setLoading(false);
  };

  const reloadProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
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
