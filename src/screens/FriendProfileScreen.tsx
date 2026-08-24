import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import {
  ScreenBackground,
  NavHeader,
  FormRing,
  StatsRow,
  Button,
  Avatar,
  ActionSheet,
  type Stat,
} from '../components';
import { searchProfiles, getHeadToHead } from '../api/profile';
import { getMyGroups } from '../api/groups';
import { getLedgerWith, type PersonEntry } from '../api/ledger';
import { blockUser } from '../api/settings';
import { useQuery, useAction } from '../hooks/useQuery';
import { formatMoney, totalsByCurrency } from '../lib/money';
import { plural } from '../lib/plural';
import { uidOrNull } from '../lib/supabase';

/** Someone else's profile: who they are, your record, and your ledger. */
export function FriendProfileScreen({ navigation, route }: any) {
  const handle = route?.params?.handle ?? '';
  const [sheetOpen, setSheetOpen] = React.useState(false);

  // Look the person up by handle so we can act on them (block, head-to-head).
  const { data: person } = useQuery<any>(
    async () => {
      const clean = String(handle).replace('@', '');
      const results = await searchProfiles(clean);
      return results.find((p: any) => p.handle === clean) ?? null;
    },
    null,
    [handle],
  );

  const personId: string | undefined = person?.id;

  const { data: h2h } = useQuery(
    async () => (personId ? getHeadToHead(personId) : { played: 0, mine: 0, theirs: 0 }),
    { played: 0, mine: 0, theirs: 0 },
    [personId],
  );

  // The ledger between the two of you, from the same query the person page uses.
  const { data: entries } = useQuery<PersonEntry[]>(
    async () => (personId ? getLedgerWith(personId) : []),
    [],
    [personId],
  );

  // Groups you actually share. Recording against somebody needs one — the
  // database refuses otherwise (shares_group_with) — so the button only appears
  // when it would work.
  const { data: shared } = useQuery(
    async () => {
      if (!personId) return 0;
      const [groups, uid] = await Promise.all([getMyGroups(), uidOrNull()]);
      if (!uid) return 0;
      return (groups ?? []).filter((g: any) =>
        (g.members ?? []).some((m: any) => m.user_id === personId),
      ).length;
    },
    0,
    [personId],
  );

  const { run: block } = useAction(blockUser);

  // A withheld Form is not a Form of 500. `private_profile` makes the search
  // function return null rather than the number (00034), so the ring shows
  // nothing and says why — the previous `?? 500` drew a full ring on an
  // invented score, which is the most convincing way to be wrong.
  const form: number | null = person?.form_score ?? null;
  const hidden: boolean = person?.is_private === true;

  const open = entries.filter((e) => e.status === 'pending');
  const awaitingMe = entries.filter((e) => e.awaitingMe);
  const netByCurrency = totalsByCurrency(
    open.map((e) => ({ currency: e.currency, cents: e.amountCents })),
  ).filter((t) => t.cents !== 0);

  // Their overall win rate cannot be counted honestly from here (see
  // getHeadToHead), so the middle column is the number that can: yours against
  // them. Groups is how many you are both in.
  const stats: Stat[] = [
    { value: form != null ? String(form) : '—', label: 'Form', highlight: true },
    {
      value: h2h.played > 0 ? `${h2h.mine}–${h2h.theirs}` : '—',
      label: 'Against you',
    },
    { value: shared > 0 ? String(shared) : '—', label: shared === 1 ? 'Group' : 'Groups' },
  ];

  const name = person?.display_name || person?.handle || handle;
  const theirHandle = person?.handle ?? String(handle).replace('@', '');
  const initials = String(name)
    .split(/\s+/)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? '')
    .join('');

  const openLedger = () =>
    navigation.navigate('PersonLedger', {
      userId: personId,
      handle: theirHandle,
      displayName: name,
    });

  return (
    <ScreenBackground tone="base">
      <NavHeader
        variant="back"
        title={theirHandle}
        onBack={() => navigation.goBack()}
        rightActions={[
          {
            icon: <Text style={styles.icon}>⋯</Text>,
            onPress: () => setSheetOpen(true),
            accessibilityLabel: 'More options',
          },
        ]}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {/* Their face, inside their Form. The ring used to hold the number
              alone and the profile had no photo on it at all. */}
          <FormRing
            percent={
              form != null ? Math.max(0, Math.min(100, Math.round(((form - 250) / 500) * 100))) : 0
            }
            size={132}
            strokeWidth={9}
          >
            <Avatar
              size="lg"
              uri={person?.avatar_url ?? undefined}
              initials={initials || '?'}
              seed={theirHandle}
            />
          </FormRing>

          <Text style={styles.name}>{name}</Text>
          {/* Display name defaults to the handle, and printing both made every
              such profile say the same word twice. */}
          {name !== theirHandle && <Text style={styles.sub}>@{theirHandle}</Text>}

          {hidden && (
            <Text style={styles.private}>
              Private profile — their Form isn&rsquo;t shown outside their groups.
            </Text>
          )}
        </View>

        <StatsRow stats={stats} />

        {/* What's between you. */}
        <Pressable
          onPress={personId ? openLedger : undefined}
          style={({ pressed }) => [
            styles.ledger,
            { backgroundColor: pressed ? colors.bg.surface2 : colors.bg.surface1 },
          ]}
        >
          <Text style={styles.ledgerLabel}>YOUR LEDGER</Text>
          {netByCurrency.length > 0 ? (
            netByCurrency.map((t) => (
              <Text key={t.currency} style={styles.ledgerLine}>
                <Text
                  style={[
                    styles.ledgerAmount,
                    { color: t.cents > 0 ? colors.semantic.win : colors.semantic.disputed },
                  ]}
                >
                  {formatMoney(Math.abs(t.cents), t.currency)}
                </Text>
                {t.cents > 0 ? ` — ${name} owes you` : ` — you owe ${name}`}
              </Text>
            ))
          ) : (
            <Text style={styles.ledgerLine}>
              {entries.length ? 'All square' : 'Nothing on the books yet'}
            </Text>
          )}
          {open.length > 0 && (
            <Text style={styles.ledgerMeta}>{plural(open.length, 'open item')}</Text>
          )}
          {awaitingMe.length > 0 && (
            <Text style={styles.waiting}>
              {plural(awaitingMe.length, 'entry', 'entries')} waiting on your answer
            </Text>
          )}
        </Pressable>

        {shared > 0 && (
          <Button
            label="Add a transaction"
            variant="secondary"
            fullWidth
            onPress={() =>
              navigation.navigate('RecordEntry', {
                userId: personId,
                handle: theirHandle,
                displayName: name,
              })
            }
          />
        )}

        <Button
          label="Call them out"
          onPress={() => navigation.navigate('CreateBet')}
          fullWidth
        />
      </ScrollView>

      <ActionSheet
        visible={sheetOpen}
        onDismiss={() => setSheetOpen(false)}
        title={theirHandle}
        options={[
          {
            label: `Block ${theirHandle}`,
            destructive: true,
            onPress: async () => {
              if (!personId) return;
              await block(personId);
              navigation.goBack();
            },
          },
        ]}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenGutter, gap: spacing[4], paddingBottom: spacing[8] },
  icon: { fontSize: 22, color: colors.text.secondary },
  hero: { alignItems: 'center', gap: spacing[2], paddingVertical: spacing[3] },
  name: { fontFamily: 'Barlow-Bold', fontSize: 20, color: colors.text.primary, marginTop: spacing[2] },
  sub: { fontFamily: 'Inter-Regular', fontSize: 12, color: colors.text.tertiary },
  private: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 260,
    marginTop: 2,
  },
  ledger: {
    borderRadius: radius.md,
    padding: spacing[4],
    gap: spacing[1],
  },
  ledgerLabel: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    color: colors.semantic.awaiting,
    marginBottom: 2,
  },
  ledgerLine: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  ledgerAmount: { fontFamily: 'Barlow-Bold', fontSize: 18 },
  ledgerMeta: { fontFamily: 'Inter-Regular', fontSize: 12, color: colors.text.tertiary },
  waiting: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.semantic.awaiting,
    marginTop: 2,
  },
});
