import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

/**
 * Phone-first auth (FLOW 1). Supabase sends a 6-digit OTP; verifying it creates
 * the auth.users row, and the on_auth_user_created trigger auto-creates the
 * profile with a placeholder handle the user renames in ProfileSetup.
 */
export async function sendOtp(phone: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({ phone: normalizePhone(phone) });
  if (error) throw error;
}

export async function verifyOtp(phone: string, token: string): Promise<Session> {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: normalizePhone(phone),
    token,
    type: 'sms',
  });
  if (error) throw error;
  if (!data.session) throw new Error('no_session_returned');
  return data.session;
}

/** Email magic-link / OTP fallback — useful in dev where SMS isn't configured. */
export async function sendEmailOtp(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) throw error;
}

export async function verifyEmailOtp(email: string, token: string): Promise<Session> {
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
  if (!data.session) throw new Error('no_session_returned');
  return data.session;
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Fires on sign-in / sign-out / token refresh. Returns an unsubscribe fn. */
export function onAuthChange(cb: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

/**
 * Claim a real handle after signup (ProfileSetup). Handles must match
 * ^[a-z0-9_]{3,20}$ — the DB enforces it, so we surface a friendly error.
 */
export async function claimHandle(handle: string, displayName: string) {
  const clean = handle.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
    throw new Error('Handle must be 3–20 characters: letters, numbers or underscore.');
  }
  const uid = (await supabase.auth.getSession()).data.session?.user.id;
  const { data, error } = await supabase
    .from('profiles')
    .update({ handle: clean, display_name: displayName.trim() })
    .eq('id', uid!)
    .select()
    .single();
  if (error) {
    // 23505 = unique_violation on profiles.handle
    if ((error as { code?: string }).code === '23505') {
      throw new Error(`@${clean} is taken — try another.`);
    }
    throw error;
  }
  return data;
}

export async function isHandleAvailable(handle: string): Promise<boolean> {
  const clean = handle.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(clean)) return false;
  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('handle', clean);
  if (error) throw error;
  return (count ?? 0) === 0;
}

// Strips spaces/dashes; assumes E.164 if it already starts with +.
function normalizePhone(phone: string): string {
  const trimmed = phone.replace(/[\s()-]/g, '');
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}
