import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { isBackendConfigured } from '../lib/supabase';

export interface QueryState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  /** True when `data` is the mock fallback rather than server data. */
  isMock: boolean;
}

/**
 * Fetch-on-mount with a mock fallback.
 *
 * Every screen keeps its mock data as the `fallback`, so the UI stays
 * explorable with no backend (demo mode) and degrades gracefully if a query
 * fails, instead of showing an empty screen.
 */
export function useQuery<T>(
  fetcher: () => Promise<T>,
  fallback: T,
  deps: unknown[] = [],
): QueryState<T> {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(isBackendConfigured);
  const [error, setError] = useState<Error | null>(null);
  // `data` is seeded with the fallback, so it *is* the mock until a fetch
  // succeeds — regardless of whether a backend is configured. This started as
  // !isBackendConfigured, which reported real data during the whole loading
  // window: CreateBet trusted it, latched onto the mock group id "g1" before
  // the real groups landed, and every bet insert failed with
  // `invalid input syntax for type uuid: "g1"`.
  const [isMock, setIsMock] = useState(true);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!isBackendConfigured) {
      setData(fallback);
      setIsMock(true);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    fetcher()
      .then((result) => {
        if (!alive) return;
        // Real data wins even when empty. Showing mock rows to a signed-in user
        // is worse than an empty state: the rows look tappable but their ids
        // don't exist, so every interaction silently fails.
        setData(result);
        setIsMock(false);
        setError(null);
      })
      .catch((e: Error) => {
        if (!alive) return;
        // Surface the failure instead of quietly pretending with mock data.
        setError(e);
        setIsMock(false);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  // React Navigation keeps screens mounted when you push past them, so the
  // effect above does not re-run on the way back and the screen shows what it
  // loaded the first time. Adding a jar rule and returning still read "No rules
  // yet"; the same staleness hit the group page after creating a bet. Refetch
  // when the screen regains focus — skipping the first focus, which the mount
  // fetch already covers.
  const mounted = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!mounted.current) {
        mounted.current = true;
        return;
      }
      refetch();
    }, [refetch]),
  );

  return { data, loading, error, refetch, isMock };
}

/** Imperative async action with loading/error state (submits, mutations). */
export function useAction<A extends unknown[], R>(fn: (...args: A) => Promise<R>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const run = useCallback(
    async (...args: A): Promise<R | null> => {
      setLoading(true);
      setError(null);
      try {
        return await fn(...args);
      } catch (e) {
        setError(e as Error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return { run, loading, error };
}
