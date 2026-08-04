import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { spacing, colors } from '../tokens';
import {
  ScreenBackground,
  NavHeader,
  JarCard,
  ViolationRow,
  Button,
  Banner,
  EmptyState,
} from '../components';
import { AddViolationSheet } from './AddViolationSheet';
import { getJar, getJarRules, ownUp } from '../api/jar';
import { getMyGroups } from '../api/groups';
import { useQuery, useAction } from '../hooks/useQuery';
import { isBackendConfigured } from '../lib/supabase';
import { Icon } from '../components';

const MOCK_VIOLATIONS = [
  { id: '1', member: { handle: '@marcus', initials: 'MJ' }, rule: 'Swearing', amount: '+$1.00', timestamp: '2h ago', disputable: true },
  { id: '2', member: { handle: '@raghav', initials: 'RS' }, rule: 'Late to plans', amount: '+$5.00', timestamp: '1d ago', ownedUp: true },
  { id: '3', member: { handle: '@abi', initials: 'AK' }, rule: 'Phone at dinner', amount: '+$2.00', timestamp: '2d ago' },
];

/**
 * A jar always belongs to a group — rules, violations and the settle-up are all
 * group-scoped. Reached from a group, or from Home which passes your first
 * group. With no groups yet there's nothing to show, so we say so.
 */
export function SwearJarScreen({ navigation, route }: any) {
  const [addVisible, setAddVisible] = useState(false);
  const cap = 50;

  // Fall back to the user's first group when opened without one (Home tile).
  const { data: groups } = useQuery(getMyGroups, [] as any[]);
  const groupId: string | undefined = route?.params?.groupId ?? groups?.[0]?.id;
  const groupName: string =
    route?.params?.groupName ?? groups?.[0]?.name ?? 'Your group';

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

  const total = jar.totalCents / 100;
  const violations = isBackendConfigured && jar.violations.length
    ? jar.violations.map(toViolationRow)
    : isBackendConfigured
      ? []
      : MOCK_VIOLATIONS;

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
          total={`$${total.toFixed(2)}`}
          groupName={groupName}
          contributionCount={violations.length}
          capProgress={Math.min(total / cap, 1)}
          capLabel={`Cap: $${cap} — jar settles when full`}
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
            {violations.map((v: any) => (
              <ViolationRow key={v.id} {...v} />
            ))}
          </View>
        )}
      </ScrollView>

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
function toViolationRow(v: any) {
  const name = v.violator?.display_name ?? v.violator?.handle ?? '??';
  return {
    id: v.id,
    member: {
      handle: v.violator?.handle ? `@${v.violator.handle}` : '@someone',
      initials: name.slice(0, 2).toUpperCase(),
    },
    rule: v.rule?.label ?? 'Rule',
    amount: `+$${((v.rule?.amount_cents ?? 0) / 100).toFixed(2)}`,
    timestamp: relativeTime(v.created_at),
    ownedUp: !!v.owned_up,
    disputable: v.status === 'pending',
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
