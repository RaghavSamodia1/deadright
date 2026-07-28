import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isBackendConfigured } from './supabase';
import { getSession, onAuthChange, signOut as apiSignOut } from '../api/auth';

interface AuthState {
  session: Session | null;
  /** True until the stored session has been read from AsyncStorage. */
  loading: boolean;
  /** Signed in, OR running in demo mode (no backend configured). */
  isAuthed: boolean;
  /** No Supabase credentials — the app runs on mock data. */
  demoMode: boolean;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthState>({
  session: null,
  loading: true,
  isAuthed: false,
  demoMode: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isBackendConfigured);

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

  const value = useMemo<AuthState>(
    () => ({
      session,
      loading,
      // In demo mode we let the user straight into the app so the UI is
      // explorable without a backend.
      isAuthed: !isBackendConfigured || !!session,
      demoMode: !isBackendConfigured,
      signOut: async () => {
        if (isBackendConfigured) await apiSignOut();
        setSession(null);
      },
    }),
    [session, loading],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthCtx);
}
