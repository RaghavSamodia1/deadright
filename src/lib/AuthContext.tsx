import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isBackendConfigured, supabase } from './supabase';
import { getSession, onAuthChange, signOut as apiSignOut } from '../api/auth';

interface AuthState {
  session: Session | null;
  /** True until the stored session has been read from AsyncStorage. */
  loading: boolean;
  /** Signed in, OR running in demo mode (no backend configured). */
  isAuthed: boolean;
  /** No Supabase credentials — the app runs on mock data. */
  demoMode: boolean;
  /** Signed in but still on the auto-generated handle — needs ProfileSetup. */
  needsProfile: boolean;
  /** Call after claiming a handle so needsProfile flips to false. */
  refreshProfile: () => void;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthState>({
  session: null,
  loading: true,
  isAuthed: false,
  demoMode: true,
  needsProfile: false,
  refreshProfile: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isBackendConfigured);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [profileChecked, setProfileChecked] = useState(true);
  const [profileTick, setProfileTick] = useState(0);

  useEffect(() => {
    if (!isBackendConfigured) return; // demo mode: nothing to restore
    let alive = true;
    getSession()
      .then((s) => alive && setSession(s))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    const unsub = onAuthChange((s) => alive && setSession(s));
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  // The DB trigger seeds every new user with handle `user_<uuid-fragment>`;
  // that's the signal they still need to pick a real one.
  useEffect(() => {
    if (!isBackendConfigured || !session) {
      setNeedsProfile(false);
      setProfileChecked(true);
      return;
    }
    let alive = true;
    setProfileChecked(false);
    supabase
      .from('profiles')
      .select('handle')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (!alive) return;
        setNeedsProfile(!!data?.handle?.startsWith('user_'));
        setProfileChecked(true);
      });
    return () => {
      alive = false;
    };
  }, [session, profileTick]);

  const value = useMemo<AuthState>(
    () => ({
      session,
      // Keep holding the splash until the profile check lands, or a new user
      // would mount on Home before needsProfile is known.
      loading: loading || (!!session && !profileChecked),
      // In demo mode we let the user straight into the app so the UI is
      // explorable without a backend.
      isAuthed: !isBackendConfigured || !!session,
      demoMode: !isBackendConfigured,
      needsProfile,
      refreshProfile: () => setProfileTick((t) => t + 1),
      signOut: async () => {
        if (isBackendConfigured) await apiSignOut();
        setSession(null);
      },
    }),
    [session, loading, needsProfile, profileChecked],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthCtx);
}
