import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const missingSupabaseConfigError = new Error(
  'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.',
);

const noSessionResponse = { data: { session: null }, error: missingSupabaseConfigError };

const noOpChannel = {
  on() {
    return this;
  },
  subscribe() {
    return this;
  },
  unsubscribe() {},
};

function createNoOpQueryBuilder() {
  return {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    single: async () => ({ data: null, error: missingSupabaseConfigError }),
  };
}

const noOpSupabaseClient = {
  auth: {
    getSession: async () => noSessionResponse,
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signInWithPassword: async () => ({ data: null, error: missingSupabaseConfigError }),
    signUp: async () => ({ data: null, error: missingSupabaseConfigError }),
    signOut: async () => ({ error: missingSupabaseConfigError }),
  },
  from: () => createNoOpQueryBuilder(),
  channel: () => noOpChannel,
  removeChannel() {},
};

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(missingSupabaseConfigError.message);
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : noOpSupabaseClient;
