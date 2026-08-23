import { supabase } from '../lib/supabase';
import { totalsByCurrency, type CurrencyTotal } from '../lib/money';

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

/**
 * Summary card numbers: lifetime net, this month, pending.
 *
 * The flat `*Cents` fields add every currency together, so they are only
 * meaningful when the matching `*ByCurrency` list has a single entry. Prefer the
 * lists — that is the whole point of them.
 */
export async function getLedgerSummary() {
  const uid = (await supabase.auth.getSession()).data.session?.user.id;
  const { data, error } = await supabase
    .from('ledger_entries')
    .select('from_user, to_user, amount_cents, status, created_at, currency')
    .or(`from_user.eq.${uid},to_user.eq.${uid}`);
  if (error) throw error;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const lifetime: { currency: string; cents: number }[] = [];
  const thisMonth: { currency: string; cents: number }[] = [];
  const pending: { currency: string; cents: number }[] = [];

  for (const e of (data ?? []) as any[]) {
    const signed = e.to_user === uid ? e.amount_cents : -e.amount_cents;
    const currency = (e.currency ?? 'GBP').toUpperCase();
    if (e.status === 'settled') {
      lifetime.push({ currency, cents: signed });
      if (new Date(e.created_at) >= monthStart) thisMonth.push({ currency, cents: signed });
    } else {
      pending.push({ currency, cents: Math.abs(signed) });
    }
  }

  const sum = (rows: { cents: number }[]) => rows.reduce((t, r) => t + r.cents, 0);

  return {
    lifetimeCents: sum(lifetime),
    thisMonthCents: sum(thisMonth),
    pendingCents: sum(pending),
    lifetimeByCurrency: totalsByCurrency(lifetime),
    thisMonthByCurrency: totalsByCurrency(thisMonth),
    pendingByCurrency: totalsByCurrency(pending),
  };
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
  /**
   * The unit this balance is in. One person can owe you in two currencies — a
   * ₹ group and a $ group — and those are two debts, not one. Netting them
   * together would invent a number that is true in neither.
   */
  currency: string;
}

/**
 * One person you have a ledger with, in one currency.
 *
 * `Balance` is the subset of this where something is still owed. The wider
 * shape exists because "who do I owe?" and "what happened between us?" are
 * different questions: the first wants only open debts, the second has to
 * include the people you have already squared up with, or settling would make
 * a friend — and every bet you ever had with them — disappear from the app.
 */
export interface Counterparty {
  userId: string;
  handle: string;
  displayName: string;
  /** Positive = they owe you. Negative = you owe them. Pending only, in cents. */
  netCents: number;
  /** Entries still open. Zero means square, which is not the same as no history. */
  openEntries: number;
  /** Every entry ever, open or settled. */
  totalEntries: number;
  /** Newest entry, epoch ms — what the settled-up list is ordered by. */
  lastAt: number;
  /**
   * The unit this balance is in. One person can owe you in two currencies — a
   * ₹ group and a $ group — and those are two debts, not one. Netting them
   * together would invent a number that is true in neither.
   */
  currency: string;
}

/**
 * Everyone you share a ledger with, netted per person and per currency.
 *
 * Jar entries have no counterparty (to_user is null: you owe the jar, not a
 * person), so they are left out of a person-to-person balance.
 */
export async function getCounterparties(): Promise<Counterparty[]> {
  const uid = (await supabase.auth.getSession()).data.session?.user.id;
  const { data, error } = await supabase
    .from('ledger_entries')
    .select(
      `from_user, to_user, amount_cents, status, currency, created_at,
       from:profiles!ledger_entries_from_user_fkey(handle, display_name),
       to:profiles!ledger_entries_to_user_fkey(handle, display_name)`,
    )
    .or(`from_user.eq.${uid},to_user.eq.${uid}`);
  if (error) throw error;

  const by = new Map<string, Counterparty>();
  for (const e of (data ?? []) as any[]) {
    if (!e.from_user || !e.to_user) continue; // jar entry, no counterparty
    const theyOweMe = e.to_user === uid;
    const otherId = theyOweMe ? e.from_user : e.to_user;
    const other = theyOweMe ? e.from : e.to;
    if (!otherId || otherId === uid) continue;

    const currency = (e.currency ?? 'GBP').toUpperCase();
    const key = `${otherId}:${currency}`;
    const row = by.get(key) ?? {
      userId: otherId,
      handle: other?.handle ?? 'someone',
      displayName: other?.display_name ?? other?.handle ?? 'Someone',
      netCents: 0,
      openEntries: 0,
      totalEntries: 0,
      lastAt: 0,
      currency,
    };
    row.totalEntries += 1;
    row.lastAt = Math.max(row.lastAt, new Date(e.created_at).getTime());
    // Only what is unsettled counts towards the balance; settled entries are
    // history, and history nets to nothing by definition.
    if (e.status === 'pending') {
      row.netCents += theyOweMe ? e.amount_cents : -e.amount_cents;
      row.openEntries += 1;
    }
    by.set(key, row);
  }

  // People you owe first, biggest first; everyone you are square with after,
  // most recent first.
  return [...by.values()].sort((a, b) => {
    const openA = a.netCents !== 0, openB = b.netCents !== 0;
    if (openA !== openB) return openA ? -1 : 1;
    if (openA) return Math.abs(b.netCents) - Math.abs(a.netCents);
    return b.lastAt - a.lastAt;
  });
}

/**
 * Running balance per person, from the entries that have not been settled.
 *
 * The ledger listed transactions but never netted them, so two people who had
 * bet a dozen times had to add it up in their heads to answer the only question
 * that matters — who is down, and by how much.
 *
 * A net of zero is square — two people who have cancelled each other out do not
 * need a row telling them so. They keep a row in getCounterparties, which is
 * where their history stays reachable.
 */
export async function getBalances(): Promise<Balance[]> {
  return (await getCounterparties())
    .filter((b) => b.netCents !== 0)
    .map((b) => ({ ...b, entries: b.openEntries }));
}

/** One entry in the history between you and one other person. */
export interface PersonEntry {
  id: string;
  /** Signed from your side: positive when they owe you. */
  amountCents: number;
  currency: string;
  status: 'pending' | 'settled';
  /** The bet it came from, where the bet still exists. */
  betTitle: string | null;
  betId: string | null;
  /** What a hand-recorded entry was for. Null on anything from a bet. */
  note: string | null;
  /** No bet behind it — recorded by one of the two people. */
  isManual: boolean;
  createdAt: string;
  at: number;
}

/**
 * Every entry between you and one person, newest first — the answer to "why do
 * I owe you fourteen pounds?".
 *
 * The balance list can only say what the total is. Until this existed the only
 * way to see what made up that total was to read the whole ledger and pick out
 * the rows with their name on, which is exactly the arithmetic the balances
 * were added to stop people doing.
 */
export async function getLedgerWith(otherUserId: string): Promise<PersonEntry[]> {
  const uid = (await supabase.auth.getSession()).data.session?.user.id;
  if (!uid) throw new Error('not_authenticated');
  const { data, error } = await supabase
    .from('ledger_entries')
    .select(
      'id, from_user, to_user, amount_cents, status, currency, created_at, note, bet_id, violation_id, bet:bets(id, title)',
    )
    .or(
      `and(from_user.eq.${uid},to_user.eq.${otherUserId}),` +
        `and(from_user.eq.${otherUserId},to_user.eq.${uid})`,
    )
    .order('created_at', { ascending: false });
  if (error) throw error;

  return ((data ?? []) as any[]).map((e) => ({
    id: e.id,
    amountCents: e.to_user === uid ? e.amount_cents : -e.amount_cents,
    currency: (e.currency ?? 'GBP').toUpperCase(),
    status: e.status === 'settled' ? 'settled' : 'pending',
    betTitle: e.bet?.title ?? null,
    betId: e.bet?.id ?? null,
    note: e.note ?? null,
    isManual: !e.bet_id && !e.violation_id,
    createdAt: e.created_at,
    at: new Date(e.created_at).getTime(),
  }));
}

/**
 * Square up with one person: marks every pending entry between the two of you
 * settled. Either side can do it — the same rule as a single entry, since the
 * ledger tracks what was agreed, not money that moved.
 */
export async function settleUpWith(
  otherUserId: string,
  /**
   * Restrict to one currency. Balances are listed per currency, so squaring up a
   * ₹ row must not quietly settle the same person's $ entries as well.
   */
  currency?: string,
): Promise<void> {
  const uid = (await supabase.auth.getSession()).data.session?.user.id;
  if (!uid) throw new Error('not_authenticated');
  let q = supabase
    .from('ledger_entries')
    .update({ status: 'settled', settled_at: new Date().toISOString() })
    .eq('status', 'pending')
    .or(
      `and(from_user.eq.${uid},to_user.eq.${otherUserId}),` +
        `and(from_user.eq.${otherUserId},to_user.eq.${uid})`,
    );
  if (currency) q = q.eq('currency', currency.toUpperCase());
  const { error } = await q;
  if (error) throw error;
}

/**
 * Delete every ledger entry you are party to, and notify the people you shared
 * them with. Returns how many rows were removed.
 *
 * Entries are shared rows, so this clears them from the other person's ledger as
 * well — hence the notification. Jar violation records are left in place, so a
 * jar can read "1 violation · 0" until it is settled again. Irreversible.
 */
export async function resetMyLedger(): Promise<number> {
  const { data, error } = await supabase.rpc('reset_my_ledger');
  if (error) {
    if (error.message.includes('not_authenticated')) {
      throw new Error('Sign in again to reset your ledger');
    }
    throw error;
  }
  return typeof data === 'number' ? data : 0;
}

/**
 * Write down something that was not a bet — a round, a taxi, a tenner.
 *
 * The ledger only ever filled itself: entries appeared when a bet resolved or a
 * jar violation was logged, so the two people who split a taxi had nowhere to
 * put it and the balance between them was true only about the betting. This is
 * the same row as any other, so it nets into the same balance and settles the
 * same way.
 *
 * `iOwe` is the direction and the only thing easy to get backwards, so the
 * screen asks it as a sentence rather than a checkbox.
 */
export async function recordEntry(args: {
  otherUserId: string;
  amountCents: number;
  note: string;
  iOwe: boolean;
  currency?: string;
}): Promise<void> {
  const { error } = await supabase.rpc('record_entry', {
    p_other: args.otherUserId,
    p_amount_cents: args.amountCents,
    p_note: args.note,
    p_i_owe: args.iOwe,
    p_currency: args.currency ?? null,
  });
  if (error) throw error;
}

/**
 * Delete a hand-recorded entry. The database refuses for anything that came
 * from a bet or a jar violation — those are a record of something that
 * happened, and settling is how they end.
 */
export async function deleteEntry(entryId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_entry', { p_entry: entryId });
  if (error) throw error;
}
