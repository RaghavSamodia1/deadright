import { useCallback, useEffect, useState } from 'react';
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
  const [isMock, setIsMock] = useState(!isBackendConfigured);
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
        // Treat an empty array as "no data yet" but still real, not mock.
        setData(result);
        setIsMock(false);
        setError(null);
      })
      .catch((e: Error) => {
        if (!alive) return;
        setError(e);
        setData(fallback); // degrade to mock rather than an empty screen
        setIsMock(true);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

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
