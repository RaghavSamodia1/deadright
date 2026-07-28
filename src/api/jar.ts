import { supabase } from '../lib/supabase';
import type { JarRule, JarViolation } from '../types/database';

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

/** Admin: empty the jar into a settlement (pizza night). */
export async function settleJar(groupId: string, note?: string) {
  const { data, error } = await supabase.rpc('settle_jar', {
    p_group: groupId,
    p_note: note ?? null,
  });
  if (error) throw error;
  return data;
}
