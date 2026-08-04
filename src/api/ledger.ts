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
