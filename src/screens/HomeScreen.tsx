import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
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
import { useQuery } from '../hooks/useQuery';
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

  const { data: bets } = useQuery<BetCardData[]>(
    async () => {
      const uid = await uidOrNull();
      return (await getFeed()).map((b) => toBetCard(b, uid));
    },
    [],
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

        {/* Row 3 — bets */}
        <Text style={styles.section}>NEEDS YOU</Text>
        {bets.map((bet) => (
          <BetCard key={bet.id} bet={bet} onPress={(b) => navigation.navigate('BetDetail', { id: b.id })} />
        ))}
        <Text style={styles.seeAll} onPress={() => navigation.navigate('AllBets')}>
          See all bets →
        </Text>
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
  seeAll: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: spacing[3],
  },
});
