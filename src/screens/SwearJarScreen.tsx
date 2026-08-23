import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { spacing, colors } from '../tokens';
import {
  ScreenBackground,
  NavHeader,
  JarCard,
  ViolationRow,
  Button,
  Banner,
  EmptyState,
  ActionSheet,
} from '../components';
import { AddViolationSheet } from './AddViolationSheet';
import { getJar, getJarRules, ownUp, deleteViolation } from '../api/jar';
import { getMyGroups } from '../api/groups';
import { useQuery, useAction } from '../hooks/useQuery';
import { useGroupCurrency } from '../hooks/useGroupCurrency';
import { formatMoney, DEFAULT_JAR_CAP_CENTS } from '../lib/money';
import { isBackendConfigured, uidOrNull } from '../lib/supabase';
import { humanError } from '../lib/errors';
import { Icon } from '../components';

/**
 * A jar always belongs to a group — rules, violations and the settle-up are all
 * group-scoped. Reached from a group, or from Home which passes your first
 * group. With no groups yet there's nothing to show, so we say so.
 */
export function SwearJarScreen({ navigation, route }: any) {
  const [addVisible, setAddVisible] = useState(false);

  // Fall back to the user's first group when opened without one (Home tile).
  const { data: groups } = useQuery(getMyGroups, [] as any[]);
  const groupId: string | undefined = route?.params?.groupId ?? groups?.[0]?.id;
  const groupName: string =
    route?.params?.groupName ?? groups?.[0]?.name ?? 'Your group';
  // The jar belongs to the group, so its unit and its cap do too — the cap was a
  // hardcoded 50 here while groups.jar_cap_cents already held the real value.
  const currency = useGroupCurrency(groupId);
  const group: any = (groups ?? []).find((g: any) => g?.id === groupId);
  const capCents: number = group?.jar_cap_cents ?? DEFAULT_JAR_CAP_CENTS;
  const cap = capCents / 100;

  const { data: jar, refetch } = useQuery(
    async () => (groupId ? await getJar(groupId) : { violations: [], totalCents: 2350 }),
    { violations: [] as any[], totalCents: 2350 },
    [groupId],
  );
  const { data: rules } = useQuery(
    async () => (groupId ? await getJarRules(groupId) : []),
    [] as any[],
    [groupId],
  );

  const { run: doOwnUp, loading: owningUp } = useAction(ownUp);

  /**
   * Violations get mis-tapped — wrong rule, wrong person, or a second tap that
   * lands twice — and until now the only way back was disputing your own
   * friend. Whoever reported it can take it out, and so can an admin, who is
   * who people ask when it was not their tap.
   *
   * It lives in a menu behind the row rather than on it: a delete control
   * sitting next to every entry in a shared ledger invites exactly the kind of
   * quiet edit the jar exists to prevent.
   */
  const { data: me } = useQuery(uidOrNull, null as string | null);
  const iAmAdmin = ((group?.members ?? []) as any[]).some(
    (m: any) => m?.user_id === me && m?.role === 'admin',
  );
  const [target, setTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Called directly rather than through useAction: its error lands in state on
  // the next render, so reading it straight after the await gives the previous
  // one. A removal that fails on `already_settled` has to say so — a silent
  // no-op here is the same bug cancelling a bet had.
  const removeViolation = async (id: string) => {
    setDeleting(true);
    try {
      await deleteViolation(id);
      refetch();
    } catch (e) {
      Alert.alert('Couldn’t remove that', humanError(e));
    } finally {
      setDeleting(false);
    }
  };

  const total = jar.totalCents / 100;
  // Marcus, Raghav and Abi used to appear here with invented fines against
  // their names whenever the backend was not configured. An empty jar says
  // "clean sheet so far", which is true; three fabricated violations are not.
  const violations = jar.violations.length
    ? jar.violations.map((v: any) => toViolationRow(v, currency, me, iAmAdmin))
    : [];

  const selfReport = async () => {
    if (!groupId || !rules.length) return setAddVisible(true);
    await doOwnUp(groupId, rules[0].id);
    refetch();
  };

  // No group means no jar — the jar is a group object by definition.
  if (isBackendConfigured && !groupId) {
    return (
      <ScreenBackground tone="base">
        <NavHeader variant="back" title="Cookie Jar" onBack={() => navigation.goBack()} />
        <EmptyState
          icon="jar"
          title="Jars live in groups"
          body="Create or join a group first — then the jar, its rules and the settle-up all belong to that group."
          ctaLabel="Create a group"
          onCtaPress={() => navigation.navigate('CreateGroup')}
          secondaryLabel="I have an invite code"
          onSecondaryPress={() => navigation.navigate('JoinGroup')}
        />
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground tone="base">
      <NavHeader
        variant="back"
        title="Cookie Jar"
        onBack={() => navigation.goBack()}
        rightActions={[
          {
            icon: <Icon name="rules" size={20} color={colors.text.secondary} strokeWidth={1.9} />,
            onPress: () => navigation.navigate('JarRules', { groupId, groupName }),
            accessibilityLabel: 'Jar rules',
          },
        ]}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <JarCard
          total={formatMoney(Math.round(total * 100), currency)}
          groupName={groupName}
          contributionCount={violations.length}
          capProgress={Math.min(total / cap, 1)}
          capLabel={`Cap: ${formatMoney(capCents, currency)} — jar settles when full`}
        />

        {total / cap > 0.8 && (
          <Banner
            tone="awaiting"
            title="Jar almost full"
            body="Hitting the cap forces a group settle-up. Pizza night?"
            actionLabel="Plan settle-up"
            onAction={() => navigation.navigate('JarRules', { groupId, groupName })}
          />
        )}

        <View style={styles.actions}>
          <Button label="ADD VIOLATION" onPress={() => setAddVisible(true)} fullWidth />
          <Button label="Own up" onPress={selfReport} loading={owningUp} variant="secondary" fullWidth />
        </View>

        <Text style={styles.sectionTitle}>RECENT VIOLATIONS</Text>
        {violations.length === 0 ? (
          <Text style={styles.empty}>Clean sheet so far. Someone will slip.</Text>
        ) : (
          <View style={styles.list}>
            {violations.map((v: any) => {
              const { id, canRemove, ...row } = v;
              return (
                <ViolationRow
                  key={id}
                  {...row}
                  onPress={canRemove ? () => setTarget(v) : undefined}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      <ActionSheet
        visible={!!target}
        title={target ? `${target.rule} · ${target.amount}` : undefined}
        options={[
          {
            label: deleting ? 'Removing…' : 'Remove from the jar',
            destructive: true,
            onPress: () => {
              const id = target?.id;
              setTarget(null);
              if (id) removeViolation(id);
            },
          },
        ]}
        onDismiss={() => setTarget(null)}
      />

      <AddViolationSheet
        visible={addVisible}
        onDismiss={() => {
          setAddVisible(false);
          refetch();
        }}
        groupId={groupId}
      />
    </ScreenBackground>
  );
}

// jar_violations row (with rule + violator joined) → ViolationRow props
function toViolationRow(v: any, currency: string | null | undefined, me: string | null, iAmAdmin: boolean) {
  const name = v.violator?.display_name ?? v.violator?.handle ?? '??';
  return {
    id: v.id,
    member: {
      handle: v.violator?.handle ? v.violator.handle : 'Someone',
      initials: name.slice(0, 2).toUpperCase(),
    },
    rule: v.rule?.label ?? 'Rule',
    amount: `+${formatMoney(v.rule?.amount_cents ?? 0, currency)}`,
    timestamp: relativeTime(v.created_at),
    ownedUp: !!v.owned_up,
    disputable: v.status === 'pending',
    // Mirrors delete_violation()'s own guard. The RPC is the authority — this
    // only decides whether to offer the menu, so a stale read costs a clear
    // error rather than a silent no-op.
    canRemove: v.reporter_id === me || iAmAdmin,
  };
}

function relativeTime(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  return hrs < 24 ? `${hrs}h ago` : `${Math.round(hrs / 24)}d ago`;
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.screenGutter,
    gap: spacing[4],
    paddingBottom: spacing[8],
  },
  rulesIcon: { fontSize: 18 },
  actions: { gap: spacing[2] },
  sectionTitle: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    color: colors.semantic.awaiting,
    marginTop: spacing[2],
  },
  empty: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.text.tertiary,
  },
  list: { gap: spacing[2] },
});
