import { supabase } from '../lib/supabase';
import type { JarRule, JarViolation } from '../types/database';
import { totalsByCurrency, type CurrencyTotal } from '../lib/money';

export async function getJarRules(groupId: string): Promise<JarRule[]> {
  const { data, error } = await supabase
    .from('jar_rules')
    .select('*')
    .eq('group_id', groupId)
    .eq('active', true)
    .order('created_at');
  if (error) throw error;
  return data;
}

export async function proposeRule(
  groupId: string,
  label: string,
  amountCents: number,
  emoji = '🤬',
): Promise<JarRule> {
  const uid = (await supabase.auth.getSession()).data.session?.user.id;
  const { data, error } = await supabase
    .from('jar_rules')
    .insert({ group_id: groupId, label, amount_cents: amountCents, emoji, created_by: uid })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Report a violation. Violator gets 24h to dispute (same machinery as bets). */
export async function addViolation(
  groupId: string,
  ruleId: string,
  violatorId: string,
): Promise<JarViolation> {
  const { data, error } = await supabase.rpc('add_violation', {
    p_group: groupId,
    p_rule: ruleId,
    p_violator: violatorId,
    p_owned_up: false,
  });
  if (error) throw error;
  return data;
}

/** One-tap self-report — skips confirmation, earns the 😇 badge. */
export async function ownUp(groupId: string, ruleId: string): Promise<JarViolation> {
  const uid = (await supabase.auth.getSession()).data.session?.user.id;
  const { data, error } = await supabase.rpc('add_violation', {
    p_group: groupId,
    p_rule: ruleId,
    p_violator: uid,
    p_owned_up: true,
  });
  if (error) throw error;
  return data;
}

/**
 * Take a violation back out of the jar.
 *
 * The reporter or a group admin only, and only while the money is still
 * pending — once a settle-up has counted it, removing it would change a total
 * the group has already divided up. The RPC deletes the ledger entry too:
 * ledger_entries.violation_id is ON DELETE SET NULL, so deleting the violation
 * on its own would leave the amount in the jar with nothing behind it.
 */
export async function deleteViolation(violationId: string) {
  const { error } = await supabase.rpc('delete_violation', { p_violation: violationId });
  if (error) throw error;
}

export async function disputeViolation(violationId: string) {
  const { error } = await supabase
    .from('jar_violations')
    .update({ status: 'disputed' })
    .eq('id', violationId);
  if (error) throw error;
}

/** Jar feed + running total for the hero card. */
export async function getJar(groupId: string) {
  const [{ data: violations, error: vError }, { data: entries, error: lError }] =
    await Promise.all([
      supabase
        .from('jar_violations')
        .select(
          `*,
           rule:jar_rules(emoji, label, amount_cents),
           violator:profiles!jar_violations_violator_id_fkey(handle, display_name, avatar_url)`,
        )
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('ledger_entries')
        .select('amount_cents, status, violation_id')
        .not('violation_id', 'is', null)
        .eq('status', 'pending'),
    ]);
  if (vError) throw vError;
  if (lError) throw lError;

  const violationIds = new Set((violations ?? []).map((v) => v.id));
  const totalCents = (entries ?? [])
    .filter((e) => violationIds.has(e.violation_id!))
    .reduce((sum, e) => sum + e.amount_cents, 0);

  return { violations: violations ?? [], totalCents };
}

/**
 * Every jar the signed-in user is in, summed — for the Home tile, which is not
 * scoped to one group. RLS already limits jar_violations to the user's groups,
 * so this needs no group filter of its own.
 */
export async function getJarSummary(): Promise<{
  totalCents: number;
  /**
   * Per-currency subtotals. Groups can each set their own unit, so the flat
   * `totalCents` below is only meaningful when this has a single entry — it used
   * to add ₹ to $ and print the result under whichever symbol the viewer had.
   */
  byCurrency: CurrencyTotal[];
  violationCount: number;
  weekCount: number;
}> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [
    { data: violations, error: vError },
    { data: entries, error: lError },
    { data: groups, error: gError },
  ] = await Promise.all([
    supabase.from('jar_violations').select('id, created_at, group_id'),
    supabase
      .from('ledger_entries')
      .select('amount_cents, violation_id')
      .not('violation_id', 'is', null)
      .eq('status', 'pending'),
    supabase.from('groups').select('id, currency'),
  ]);
  if (vError) throw vError;
  if (lError) throw lError;
  if (gError) throw gError;

  const currencyOfGroup = new Map<string, string>(
    (groups ?? []).map((g: any) => [g.id, (g.currency ?? 'GBP').toUpperCase()]),
  );
  const groupOfViolation = new Map<string, string>(
    (violations ?? []).map((v: any) => [v.id, v.group_id]),
  );

  const ids = new Set((violations ?? []).map((v) => v.id));
  const owed = (entries ?? []).filter((e) => ids.has(e.violation_id!));

  return {
    totalCents: owed.reduce((sum, e) => sum + e.amount_cents, 0),
    byCurrency: totalsByCurrency(
      owed.map((e) => ({
        currency: currencyOfGroup.get(groupOfViolation.get(e.violation_id!) ?? '') ?? 'GBP',
        cents: e.amount_cents,
      })),
    ),
    violationCount: violations?.length ?? 0,
    weekCount: (violations ?? []).filter((v) => v.created_at >= weekAgo).length,
  };
}

/** Admin: empty the jar into a settlement (pizza night). */
export async function settleJar(groupId: string, note?: string) {
  const { data, error } = await supabase.rpc('settle_jar', {
    p_group: groupId,
    p_note: note ?? null,
  });
  if (error) throw error;
  return data;
}

/**
 * One row per group the user is in, with that group's jar total.
 *
 * The Home tile aggregates every jar, so tapping it needs the breakdown rather
 * than a single group's. RLS already scopes all three tables to the caller's
 * groups (jar ledger rows became visible to co-members in 00015), so no group
 * filter is needed here.
 */
export async function getJarsByGroup(): Promise<
  {
    groupId: string;
    name: string;
    emoji: string | null;
    totalCents: number;
    violationCount: number;
    /** The group's own unit — jar totals across groups are not comparable. */
    currency: string;
  }[]
> {
  const [{ data: groups, error: gErr }, { data: violations, error: vErr }, { data: entries, error: lErr }] =
    await Promise.all([
      supabase.from('groups').select('id, name, emoji, currency').order('created_at'),
      supabase.from('jar_violations').select('id, group_id'),
      supabase
        .from('ledger_entries')
        .select('amount_cents, violation_id')
        .not('violation_id', 'is', null)
        .eq('status', 'pending'),
    ]);
  if (gErr) throw gErr;
  if (vErr) throw vErr;
  if (lErr) throw lErr;

  const groupOfViolation = new Map<string, string>();
  const countByGroup = new Map<string, number>();
  (violations ?? []).forEach((v) => {
    groupOfViolation.set(v.id, v.group_id);
    countByGroup.set(v.group_id, (countByGroup.get(v.group_id) ?? 0) + 1);
  });

  const totalByGroup = new Map<string, number>();
  (entries ?? []).forEach((e) => {
    const g = groupOfViolation.get(e.violation_id!);
    if (g) totalByGroup.set(g, (totalByGroup.get(g) ?? 0) + e.amount_cents);
  });

  return (groups ?? []).map((g) => ({
    groupId: g.id,
    name: g.name,
    emoji: g.emoji,
    totalCents: totalByGroup.get(g.id) ?? 0,
    violationCount: countByGroup.get(g.id) ?? 0,
    currency: (g as any).currency ?? 'GBP',
  }));
}
