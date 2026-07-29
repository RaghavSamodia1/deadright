import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing } from '../tokens';
import {
  ScreenBackground,
  NavHeader,
  BentoTile,
  BetCard,
  type BetCardData,
} from '../components';
import { getFeed } from '../api/bets';
import { getMyProfile } from '../api/profile';
import { getLedgerSummary } from '../api/ledger';
import { getMyGroups } from '../api/groups';
import { isBackendConfigured } from '../lib/supabase';
import { Button, ListRow } from '../components';
import { useQuery } from '../hooks/useQuery';
import { useRealtime } from '../hooks/useRealtime';
import { uidOrNull } from '../lib/supabase';
import { toBetCard } from '../lib/mappers';

// v2 bento hub (design-v2.md §2) — no bottom nav; tiles are the navigation.
export function HomeScreen({ navigation }: any) {
  const jarTotal = 23.5;
  const jarCap = 50;

  const { data: profile } = useQuery(getMyProfile, {
    handle: 'you',
    display_name: 'You',
    cred_score: 847,
    current_streak: 5,
    best_streak: 8,
  } as any);

  const { data: summary } = useQuery(getLedgerSummary, {
    lifetimeCents: 14500,
    thisMonthCents: 0,
    pendingCents: 0,
  });

  const { data: bets, error: feedError, refetch: refetchFeed } = useQuery<BetCardData[]>(
    async () => {
      const uid = await uidOrNull();
      return (await getFeed()).map((b) => toBetCard(b, uid));
    },
    [],
  );

  // No group means no feed, no jar and no ledger — everything is group-scoped,
  // so that's the first thing to fix rather than showing empty tiles.
  const { data: groups, refetch: refetchGroups } = useQuery(getMyGroups, [] as any[]);
  const noGroups = isBackendConfigured && groups.length === 0;

  // Someone else calling a bet or joining a side should show up without a
  // navigate-away-and-back.
  useRealtime('bets', refetchFeed);
  useRealtime('bet_participants', refetchFeed);
  useRealtime('group_members', refetchGroups);

  // Coming back to Home after creating a group/bet should reflect it.
  useFocusEffect(
    useCallback(() => {
      refetchFeed();
      refetchGroups();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  return (
    <ScreenBackground tone="base">
      <NavHeader
        variant="home"
        showAvatar
        avatarInitials={(profile.display_name ?? 'You').slice(0, 2).toUpperCase()}
        onAvatarPress={() => navigation.navigate('Profile')}
        rightActions={[
          {
            icon: <Text style={styles.bell}>🔔</Text>,
            onPress: () => navigation.navigate('Alerts'),
            accessibilityLabel: 'Alerts',
          },
        ]}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Row 1 — Cookie Jar hero + cred/streak column */}
        <View style={styles.row}>
          <BentoTile
            size="hero"
            tone="amber"
            emoji="🍪"
            value={`$${jarTotal.toFixed(2)}`}
            label="4 violations this week"
            caption="Open the jar →"
            // No group param: the jar screen falls back to your first group,
            // and prompts you to make one if you have none.
            onPress={() => navigation.navigate('CookieJar')}
          >
            <View style={styles.capTrack}>
              <View style={[styles.capFill, { width: `${(jarTotal / jarCap) * 100}%` }]} />
            </View>
          </BentoTile>
          <View style={styles.col}>
            <BentoTile
              size="stat" tone="navy" value={`${profile.cred_score}`} label="Cred" caption="Profile →"
              onPress={() => navigation.navigate('Profile')}
            />
            <BentoTile
              size="stat" tone="flame"
              value={`${profile.current_streak}×`} label="Streak"
              caption={`Best: ${profile.best_streak}`}
            />
          </View>
        </View>

        {/* Row 2 — navigation strip (replaces the tab bar) */}
        <View style={styles.row}>
          <BentoTile
            size="nav" tone="mint-tint" value={`${money(summary.lifetimeCents)}`} label="Ledger →"
            onPress={() => navigation.navigate('Ledger')}
          />
          <BentoTile
            size="nav" tone="violet-tint" value="🎉" label="Party Pool"
            onPress={() => navigation.navigate('CreatePool')}
          />
          <BentoTile
            size="nav" tone="amber" value="+" label="New Bet"
            onPress={() => navigation.navigate('CreateBet')}
          />
        </View>

        {/* Row 3 — bets, or the first-run path into the social loop */}
        {feedError ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Couldn’t load your feed</Text>
            <Text style={styles.noticeBody}>{feedError.message}</Text>
          </View>
        ) : noGroups ? (
          <View style={styles.firstRun}>
            <Text style={styles.section}>START HERE</Text>
            <Text style={styles.firstRunTitle}>Bets need people.</Text>
            <Text style={styles.firstRunBody}>
              Make a group with your friends, or join theirs with a code. Everything —
              bets, the Cookie Jar, the ledger — lives inside a group.
            </Text>
            <Button label="Create a group" onPress={() => navigation.navigate('CreateGroup')} fullWidth />
            <Button
              label="I have an invite code"
              onPress={() => navigation.navigate('JoinGroup')}
              variant="secondary"
              fullWidth
            />
          </View>
        ) : (
          <>
            {/* Your groups — the only way back into a group after creating it */}
            <Text style={styles.section}>YOUR GROUPS</Text>
            {groups.map((g: any) => (
              <ListRow
                key={g.id}
                title={`${g.emoji ?? '👥'}  ${g.name}`}
                subtitle={`${g.members?.length ?? 0} members · tap for jar, bets & invite code`}
                showChevron
                onPress={() => navigation.navigate('Group', { id: g.id, name: g.name })}
              />
            ))}
            <Text style={styles.seeAll} onPress={() => navigation.navigate('CreateGroup')}>
              + New group
            </Text>
          </>
        )}

        {!noGroups && !feedError && (bets.length === 0 ? (
          <View style={styles.firstRun}>
            <Text style={styles.section}>NEEDS YOU</Text>
            <Text style={styles.firstRunBody}>
              Nothing open right now. Call something and drag the group in.
            </Text>
            <Button label="Call it 🔥" onPress={() => navigation.navigate('CreateBet')} fullWidth />
          </View>
        ) : (
          <>
            <Text style={styles.section}>NEEDS YOU</Text>
            {bets.map((bet) => (
              <BetCard
                key={bet.id}
                bet={bet}
                onPress={(b) => navigation.navigate('BetDetail', { id: b.id })}
              />
            ))}
            <Text style={styles.seeAll} onPress={() => navigation.navigate('AllBets')}>
              See all bets →
            </Text>
          </>
        ))}
      </ScrollView>
    </ScreenBackground>
  );
}

const money = (cents: number) =>
  `${cents >= 0 ? '+' : '−'}$${Math.abs(cents / 100).toFixed(0)}`;

const styles = StyleSheet.create({
  content: {
    padding: spacing.screenGutter,
    gap: spacing[3],
    paddingBottom: spacing[8],
  },
  row: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  col: {
    gap: spacing[3],
  },
  bell: { fontSize: 18 },
  capTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(14,18,26,0.15)',
    marginTop: spacing[3],
    overflow: 'hidden',
  },
  capFill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.text.inverse,
  },
  section: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    color: colors.semantic.awaiting,
    marginTop: spacing[2],
  },
  firstRun: { gap: spacing[3], marginTop: spacing[2] },
  firstRunTitle: {
    fontFamily: 'Barlow-Black',
    fontSize: 22,
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  firstRunBody: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 21,
    color: colors.text.secondary,
  },
  notice: {
    backgroundColor: colors.semantic.disputedDim,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.semantic.disputed,
    padding: spacing[4],
    gap: 4,
    marginTop: spacing[3],
  },
  noticeTitle: {
    fontFamily: 'Barlow-Bold',
    fontSize: 15,
    color: colors.semantic.disputed,
  },
  noticeBody: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.text.secondary,
  },
  seeAll: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: spacing[3],
  },
});
