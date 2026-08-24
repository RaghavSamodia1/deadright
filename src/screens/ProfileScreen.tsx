import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import {
  ScreenBackground,
  NavHeader,
  FormRing,
  StatsRow,
  FilterChip,
  BetCard,
  SkeletonBetCard,
  Avatar,
  Button,
  Icon,
  type BetCardData,
  type Stat,
} from '../components';
import { getMyProfile, getStats } from '../api/profile';
import { getFeed } from '../api/bets';
import { useQuery } from '../hooks/useQuery';
import { uidOrNull } from '../lib/supabase';
import { toBetCard } from '../lib/mappers';
import { useCurrency } from '../hooks/useCurrency';

type Tab = 'all' | 'wins' | 'losses';

/**
 * Your own profile.
 *
 * It used to be a form ring with a handle under it. Everything else the profile
 * row carries — your display name, your photo, your bio, your streak — was
 * either fetched and never drawn or not fetched at all, and there was no way to
 * reach the edit screen except by going through Settings.
 *
 * The ring keeps the form and now holds your face, which is what FormRing's
 * `children` prop was written for and had never once been passed.
 */
export function ProfileScreen({ navigation }: any) {
  const [tab, setTab] = useState<Tab>('all');
  const currency = useCurrency();

  const { data: profile } = useQuery(getMyProfile, {
    handle: '',
    display_name: '',
    bio: null,
    avatar_url: null,
    form_score: 500,
    current_streak: 0,
    best_streak: 0,
  } as any);

  const { data: myStats } = useQuery(
    async () => {
      const uid = await uidOrNull();
      return uid ? await getStats(uid) : { total: 0, wins: 0, losses: 0, winRate: 0 };
    },
    { total: 0, wins: 0, losses: 0, winRate: 0 },
  );

  const form = profile.form_score ?? 500;
  // Form runs on a 500-point spread around a 500 baseline (recompute_form).
  const percentile = Math.max(0, Math.min(100, Math.round(((form - 250) / 500) * 100)));
  const streak = profile.current_streak ?? 0;

  const stats: Stat[] = [
    // getStats counts resolved bets only, so "Called" read 0 while an open
    // bet of theirs sat right below it. Label what it actually measures.
    { value: `${myStats.total}`, label: 'Settled' },
    { value: `${myStats.winRate}%`, label: 'Win rate' },
    { value: `${form}`, label: 'Form', highlight: true },
  ];

  // Two invented bets used to stand here as the initial value — "England reach
  // the Euros final", won, eleven people, attributed to you — so your own
  // profile opened on somebody else's history until the real feed arrived.
  // Fabricated content dressed as a loading state is the worst of both: it is
  // not true, and it is not honest about waiting.
  //
  // getFeed returns every bet you can see, which on a profile meant listing
  // bets you had nothing to do with under the heading of your own record.
  // Narrowed to the ones you are actually in.
  const { data: history, loading: historyLoading } = useQuery<BetCardData[]>(
    async () => {
      const uid = await uidOrNull();
      return (await getFeed())
        .filter(
          (b: any) =>
            b.creator_id === uid ||
            (b.participants ?? []).some((p: any) => p.user_id === uid),
        )
        .map((b) => toBetCard(b, uid, currency));
    },
    [],
  );

  const filtered =
    tab === 'all'
      ? history
      : history.filter((b) => (tab === 'wins' ? b.status === 'win' : b.status === 'loss'));

  const name = profile.display_name || profile.handle || 'You';
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <ScreenBackground tone="base">
      <NavHeader
        variant="back"
        title="Profile"
        onBack={() => navigation.goBack()}
        rightActions={[
          {
            icon: <Icon name="gear" size={20} color={colors.text.secondary} strokeWidth={1.9} />,
            onPress: () => navigation.navigate('Settings'),
            accessibilityLabel: 'Settings',
          },
        ]}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <FormRing percent={percentile} size={148} strokeWidth={10}>
            <Avatar
              size="xl"
              uri={profile.avatar_url ?? undefined}
              initials={initials || '?'}
              seed={profile.handle}
            />
          </FormRing>

          <Text style={styles.name}>{name}</Text>
          {!!profile.handle && <Text style={styles.handle}>@{profile.handle}</Text>}

          {!!profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          <Text style={styles.record}>
            {myStats.total > 0
              ? `${myStats.wins}W · ${myStats.losses}L · Your word is your bond`
              : 'Your word is your bond'}
          </Text>

          {/* current_streak was fetched and never drawn. */}
          {streak > 0 && (
            <View style={styles.streak}>
              <Icon name="flame" size={14} color={colors.brand.flame} strokeWidth={2} />
              <Text style={styles.streakText}>
                {streak} in a row
                {profile.best_streak > streak ? ` · best ${profile.best_streak}` : ''}
              </Text>
            </View>
          )}

          <Button
            label="Edit profile"
            variant="secondary"
            size="sm"
            onPress={() => navigation.navigate('ProfileEdit')}
            style={styles.edit}
          />
        </View>

        <StatsRow stats={stats} />

        <View style={styles.tabs}>
          <FilterChip label="All" active={tab === 'all'} onPress={() => setTab('all')} />
          <FilterChip label="Wins" active={tab === 'wins'} onPress={() => setTab('wins')} />
          <FilterChip label="Losses" active={tab === 'losses'} onPress={() => setTab('losses')} />
        </View>

        {historyLoading && history.length === 0 ? (
          <>
            <SkeletonBetCard />
            <SkeletonBetCard />
          </>
        ) : filtered.length === 0 ? (
          <Text style={styles.emptyHistory}>
            {tab === 'all'
              ? "You haven't called anything yet."
              : tab === 'wins'
                ? 'No wins on the board yet.'
                : 'No losses. Yet.'}
          </Text>
        ) : (
          filtered.map((b) => (
            <BetCard key={b.id} bet={b} onPress={() => navigation.navigate('BetDetail', { id: b.id })} />
          ))
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.screenGutter,
    gap: spacing[4],
    paddingBottom: spacing[8],
  },
  hero: {
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: colors.bg.surface1,
    borderRadius: radius.md,
    paddingVertical: spacing[5],
    paddingHorizontal: spacing[4],
  },
  name: {
    fontFamily: 'Barlow-Bold',
    fontSize: 22,
    color: colors.text.primary,
    marginTop: spacing[3],
    textAlign: 'center',
  },
  handle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.text.tertiary,
  },
  bio: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 19,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing[2],
  },
  record: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing[2],
  },
  streakText: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 12,
    letterSpacing: 0.4,
    color: colors.brand.flame,
  },
  // The hero centres its children, but Button sizes itself and does not
  // inherit that, so the pill sat against the left edge of a centred card.
  edit: { marginTop: spacing[4], alignSelf: 'center' },
  emptyHistory: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.text.tertiary,
    paddingVertical: spacing[5],
    textAlign: 'center',
  },
  tabs: { flexDirection: 'row', gap: spacing[2] },
});
