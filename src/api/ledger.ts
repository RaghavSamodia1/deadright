import { supabase } from '../lib/supabase';

/** S37 — full ledger with bet context, newest first. */
export async function getLedger() {
  const uid = (await supabase.auth.getSession()).data.session?.user.id;
  const { data, error } = await supabase
    .from('ledger_entries')
    .select(
      `*,
       bet:bets(title),
       from:profiles!ledger_entries_from_user_fkey(handle, display_name),
       to:profiles!ledger_entries_to_user_fkey(handle, display_name)`,
    )
    .or(`from_user.eq.${uid},to_user.eq.${uid}`)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data;
}

/** Summary card numbers: lifetime net, this month, pending. */
export async function getLedgerSummary() {
  const uid = (await supabase.auth.getSession()).data.session?.user.id;
  const { data, error } = await supabase
    .from('ledger_entries')
    .select('from_user, to_user, amount_cents, status, created_at')
    .or(`from_user.eq.${uid},to_user.eq.${uid}`);
  if (error) throw error;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  let lifetime = 0;
  let thisMonth = 0;
  let pending = 0;
  for (const e of data ?? []) {
    const signed = e.to_user === uid ? e.amount_cents : -e.amount_cents;
    if (e.status === 'settled') {
      lifetime += signed;
      if (new Date(e.created_at) >= monthStart) thisMonth += signed;
    } else {
      pending += Math.abs(signed);
    }
  }
  return { lifetimeCents: lifetime, thisMonthCents: thisMonth, pendingCents: pending };
}

/** Mark a pending entry settled ("Sam paid you"). Either party can mark. */
export async function markSettled(entryId: string) {
  const { error } = await supabase
    .from('ledger_entries')
    .update({ status: 'settled', settled_at: new Date().toISOString() })
    .eq('id', entryId);
  if (error) throw error;
}

export interface Balance {
  userId: string;
  handle: string;
  displayName: string;
  /** Positive = they owe you. Negative = you owe them. In cents. */
  netCents: number;
  entries: number;
}

/**
 * Running balance per person, from the entries that have not been settled.
 *
 * The ledger listed transactions but never netted them, so two people who had
 * bet a dozen times had to add it up in their heads to answer the only question
 * that matters — who is down, and by how much.
 *
 * Jar entries have no counterparty (to_user is null: you owe the jar, not a
 * person), so they are left out of a person-to-person balance.
 */
export async function getBalances(): Promise<Balance[]> {
  const uid = (await supabase.auth.getSession()).data.session?.user.id;
  const { data, error } = await supabase
    .from('ledger_entries')
    .select(
      `from_user, to_user, amount_cents, status,
       from:profiles!ledger_entries_from_user_fkey(handle, display_name),
       to:profiles!ledger_entries_to_user_fkey(handle, display_name)`,
    )
    .eq('status', 'pending')
    .or(`from_user.eq.${uid},to_user.eq.${uid}`);
  if (error) throw error;

  const by = new Map<string, Balance>();
  for (const e of (data ?? []) as any[]) {
    if (!e.from_user || !e.to_user) continue; // jar entry, no counterparty
    const theyOweMe = e.to_user === uid;
    const otherId = theyOweMe ? e.from_user : e.to_user;
    const other = theyOweMe ? e.from : e.to;
    if (!otherId || otherId === uid) continue;

    const row = by.get(otherId) ?? {
      userId: otherId,
      handle: other?.handle ?? 'someone',
      displayName: other?.display_name ?? other?.handle ?? 'Someone',
      netCents: 0,
      entries: 0,
    };
    row.netCents += theyOweMe ? e.amount_cents : -e.amount_cents;
    row.entries += 1;
    by.set(otherId, row);
  }

  // A net of zero is square — two people who have cancelled each other out do
  // not need a row telling them so.
  return [...by.values()]
    .filter((b) => b.netCents !== 0)
    .sort((a, b) => Math.abs(b.netCents) - Math.abs(a.netCents));
}

/**
 * Square up with one person: marks every pending entry between the two of you
 * settled. Either side can do it — the same rule as a single entry, since the
 * ledger tracks what was agreed, not money that moved.
 */
export async function settleUpWith(otherUserId: string): Promise<void> {
  const uid = (await supabase.auth.getSession()).data.session?.user.id;
  if (!uid) throw new Error('not_authenticated');
  const { error } = await supabase
    .from('ledger_entries')
    .update({ status: 'settled', settled_at: new Date().toISOString() })
    .eq('status', 'pending')
    .or(
      `and(from_user.eq.${uid},to_user.eq.${otherUserId}),` +
        `and(from_user.eq.${otherUserId},to_user.eq.${uid})`,
    );
  if (error) throw error;
}
