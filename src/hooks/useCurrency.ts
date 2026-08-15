import { getSettings } from '../api/settings';
import { useQuery } from './useQuery';

/**
 * The currency the user picked in Settings.
 *
 * Money was being formatted with a hardcoded "$" in the bento tiles while
 * Settings said INR, so the preference existed and did nothing. Every place
 * that prints an amount should take its symbol from here.
 */
export function useCurrency(): string {
  const { data } = useQuery(getSettings, { currency: 'GBP' } as any);
  return (data as any)?.currency ?? 'GBP';
}
