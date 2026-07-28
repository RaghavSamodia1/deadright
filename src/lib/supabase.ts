import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True when real Supabase credentials are present. When false the app runs on
 * mock data (demo mode) instead of crashing at import — a missing .env used to
 * blow up createClient() and render a blank screen.
 */
export const isBackendConfigured = Boolean(url && anonKey);

// Placeholder values keep createClient() happy in demo mode; no request is ever
// made because callers check isBackendConfigured (see hooks/useQuery).
export const supabase: SupabaseClient = createClient(
  url ?? 'https://demo.invalid',
  anonKey ?? 'public-anon-key-placeholder',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: isBackendConfigured,
      persistSession: isBackendConfigured,
      detectSessionInUrl: false, // RN: deep links handled manually
    },
  },
);

/** Current user id or throws — call sites assume an authed session. */
export async function uidAsync(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error('not_authenticated');
  return data.session.user.id;
}

/** Current user id, or null when signed out (non-throwing variant). */
export async function uidOrNull(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}
