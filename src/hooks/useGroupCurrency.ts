import { useQuery } from './useQuery';
import { getMyGroups } from '../api/groups';
import { useCurrency } from './useCurrency';

/**
 * The unit a group's money is read in — identical for every member.
 *
 * Jar violations, the jar cap, stakes and ledger entries are all group-scoped, so
 * they must be shown in the group's currency rather than the viewer's. Reading
 * them from `user_settings` is what let two members of one group see the same jar
 * as ₹2 and $2.
 *
 * The viewer's own default is only a fallback: no group (a solo bet), or the
 * group list not yet loaded.
 */
export function useGroupCurrency(groupId?: string | null): string {
  const fallback = useCurrency();
  const { data: groups } = useQuery(getMyGroups, [] as any[]);
  if (!groupId) return fallback;
  const group = (groups ?? []).find((g: any) => g?.id === groupId);
  return ((group as any)?.currency ?? fallback).toUpperCase();
}
