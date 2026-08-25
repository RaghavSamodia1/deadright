import React, { useCallback } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, relief } from '../tokens';
import {
  ScreenBackground,
  NavHeader,
  BentoTile,
  Rise,
  Swap,
  SoundBoard,
  ActionSheet,
  BetCard,
  Icon,
  type BetCardData,
} from '../components';
import { getFeed } from '../api/bets';
import { getMyProfile } from '../api/profile';
import { getLedgerSummary } from '../api/ledger';
import { getMyGroups } from '../api/groups';
import { getUnreadCount } from '../api/notifications';
import { isBackendConfigured } from '../lib/supabase';
import { Button, ListRow } from '../components';
import { getJarSummary } from '../api/jar';
import { useQuery } from '../hooks/useQuery';
import { useRealtime } from '../hooks/useRealtime';
import { uidOrNull } from '../lib/supabase';
import { toBetCard } from '../lib/mappers';
import { plural } from '../lib/plural';
import { humanError } from '../lib/errors';
import { useCurrency } from '../hooks/useCurrency';
import { formatMoney, formatTotals, DEFAULT_JAR_CAP_CENTS } from '../lib/money';

// v2 bento hub (design-v2.md §2) — no bottom nav; tiles are the navigation.
export function HomeScreen({ navigation }: any) {
  const currency = useCurrency();

  // The bento has a back. Nothing else in the app depends on this, and nothing
  // is recorded by it — it exists because an app about calling your friends out
  // should be able to play a sad trombone at them.
  const [board, setBoard] = React.useState(false);
  const [moreOpen, setMoreOpen] = React.useState(false);

  // Was a hardcoded 23.5 with a hardcoded "4 violations this week" — it showed
  // $23.50 to an account whose only jar was empty.
  const { data: jarSummary, refetch: refetchJar } = useQuery(getJarSummary, {
    byCurrency: [],
    totalCents: 0,
    violationCount: 0,
    weekCount: 0,
  });
  // Groups each carry their own currency, so the jars cannot be added into one
  // figure. The hero shows the biggest currency's subtotal and owns up to the
  // rest in its caption; AllJars has the full breakdown.
  const jarTotals = jarSummary.byCurrency ?? [];
  const jarMixed = jarTotals.length > 1;
  const jarCurrency = jarTotals[0]?.currency ?? currency;
  const jarTotal = (jarTotals[0]?.cents ?? 0) / 100;

  const { data: profile } = useQuery(getMyProfile, {
    handle: '',
    display_name: '',
    // Not 847 with a five-bet streak, which is what stood here until the real
    // profile landed — a stranger's record on your own home screen. 500 is the
    // Form baseline every account actually starts at.
    form_score: 500,
    current_streak: 0,
    best_streak: 0,
  } as any);

  const { data: summary } = useQuery(getLedgerSummary, {
    lifetimeCents: 0,
    thisMonthCents: 0,
    pendingCents: 0,
    lifetimeByCurrency: [],
    thisMonthByCurrency: [],
    pendingByCurrency: [],
  });

  // Same rule as the jar hero: the tile shows the dominant currency's net rather
  // than a sum across units that means nothing.
  const ledgerTotals = summary.lifetimeByCurrency ?? [];
  const ledgerCents = ledgerTotals[0]?.cents ?? 0;
  const ledgerCurrency = ledgerTotals[0]?.currency ?? currency;

  const {
    data: bets,
    error: feedError,
    loading: feedLoading,
    refetch: refetchFeed,
  } = useQuery<BetCardData[]>(
    async () => {
      const uid = await uidOrNull();
      return (await getFeed()).map((b) => toBetCard(b, uid, currency));
    },
    [],
  );

  // No group means no feed, no jar and no ledger — everything is group-scoped,
  // so that's the first thing to fix rather than showing empty tiles.
  const { data: groups, refetch: refetchGroups } = useQuery(getMyGroups, [] as any[]);
  const noGroups = isBackendConfigured && groups.length === 0;

  // groups.jar_cap_cents has held the real cap since the first migration; this
  // was a hardcoded 50 that ignored it.
  const jarCap =
    ((groups ?? []).reduce(
      (sum: number, g: any) => sum + (g?.jar_cap_cents ?? DEFAULT_JAR_CAP_CENTS),
      0,
    ) || DEFAULT_JAR_CAP_CENTS) / 100;


  // Someone else calling a bet or joining a side should show up without a
  // navigate-away-and-back.
  const { data: unread, refetch: refetchUnread } = useQuery(getUnreadCount, 0);
  useRealtime('notifications', refetchUnread);

  useRealtime('bets', refetchFeed);
  useRealtime('bet_participants', refetchFeed);
  useRealtime('group_members', refetchGroups);

  // Coming back to Home after creating a group/bet should reflect it.
  useFocusEffect(
    useCallback(() => {
      refetchFeed();
      refetchGroups();
      refetchJar();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  return (
    <ScreenBackground tone="base">
      <NavHeader
        variant="home"
        showAvatar
        avatarInitials={(profile.display_name ?? 'You').slice(0, 2).toUpperCase()}
        avatarUri={profile.avatar_url ?? undefined}
        avatarSeed={profile.handle || undefined}
        onAvatarPress={() => navigation.navigate('Profile')}
        rightActions={[
          {
            // Search belongs in the header. It was one of eleven tiles, which
            // made finding a person something you could only start from this
            // screen — and only after picking it out of a grid.
            icon: <Icon name="search" size={21} color={colors.text.secondary} strokeWidth={1.9} />,
            onPress: () => navigation.navigate('Search'),
            accessibilityLabel: 'Search',
          },
          {
            icon: (
              <View>
                <Icon name="bell" size={21} color={colors.text.secondary} strokeWidth={1.9} />
                {unread > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
                  </View>
                )}
              </View>
            ),
            onPress: () => navigation.navigate('Alerts'),
            accessibilityLabel:
              unread > 0 ? `Alerts, ${unread} unread` : 'Alerts',
          },
          {
            // The overflow menu: conventional, and the place for everything
            // that does not earn a tile.
            icon: <Icon name="more" size={21} color={colors.text.secondary} strokeWidth={1.9} />,
            onPress: () => setMoreOpen(true),
            accessibilityLabel: 'More',
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={feedLoading}
            onRefresh={() => {
              refetchFeed();
              refetchGroups();
              refetchUnread();
            }}
            tintColor={colors.semantic.awaiting}
            colors={[colors.semantic.awaiting]}
          />
        }
      >
        <Swap
          showing={board}
          b={<SoundBoard active={board} onClose={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setBoard(false);
          }} />}
          a={
        <View style={styles.bento}>
        {/* Row 1 — Cookie Jar hero + form/streak column */}
        <Rise index={0}>
        <View style={styles.row}>
          <BentoTile
            size="hero"
            tone="amber"
            icon="jar"
            countUp={jarTotal}
            formatValue={(n) => formatMoney(Math.round(n * 100), jarCurrency)}
            label={
              jarSummary.weekCount > 0
                ? `${jarSummary.weekCount} this week`
                : jarSummary.violationCount > 0
                  ? `${jarSummary.violationCount} all time`
                  : 'Nobody has slipped yet'
            }
            caption={
              jarMixed
                ? `+ ${formatTotals(jarTotals.slice(1))} more`
                : 'Open the jar'
            }
            // The tile sums every group's jar, so it opens the breakdown —
            // sending it to CookieJar with no group silently showed only
            // whichever group came first.
            onPress={() => navigation.navigate('AllJars')}
          >
            {!jarMixed && (
              <View style={styles.capTrack}>
                <View
                  style={[
                    styles.capFill,
                    { width: `${Math.min(jarTotal / jarCap, 1) * 100}%` },
                  ]}
                />
              </View>
            )}
          </BentoTile>
          <View style={styles.col}>
            <BentoTile
              size="stat" tone="violet-tint" countUp={profile.form_score} label="Form" caption="Details"
              onPress={() => navigation.navigate('Form')}
            />
            <BentoTile
              size="stat" tone="flame"
              value={`${profile.current_streak}×`} label="Streak"
              caption={`Best: ${profile.best_streak}`}
            />
          </View>
        </View>

        </Rise>

        {/* Row 2 — Groups takes the large tile: everything in the app lives
            inside one, so it earns more than a third of a strip. Search left
            the grid for the header, where people look for it. */}
        <Rise index={1}>
        <View style={styles.row}>
          <BentoTile
            size="feature" tone="navy" icon="users"
            value={`${groups.length}`}
            // The screen behind it has always been "Groups & people"; the tile
            // only advertised half of what it opens.
            label="Groups & people"
            caption="Open them"
            onPress={() => navigation.navigate('Groups')}
          />
          <View style={styles.col}>
            <BentoTile
              size="nav"
              // Was always mint-tint with a rising arrow, so being £5 down was
              // drawn as being up. The tile follows the number.
              tone={ledgerCents >= 0 ? 'mint-tint' : 'coral-tint'}
              value={money(ledgerCents, ledgerCurrency)}
              label="Ledger"
              icon="ledger"
              onPress={() => navigation.navigate('Ledger')}
            />
            <BentoTile
              size="nav" tone="teal-tint" label="Settle it" icon="dice"
              onPress={() => navigation.navigate('Settle')}
            />
          </View>
        </View>

        </Rise>

        {/* Row 3 — the primary action, on its own.
            This strip used to carry five more tiles: Pools, Join code, Sounds
            and Search alongside these. A grid where an easter egg sits at the
            same weight as the ledger is a launcher, not a dashboard, and the
            eye had eleven things to rank. The rest moved to the header's
            overflow menu, which is where a familiar app keeps the things you
            reach for occasionally. */}
        <Rise index={2}>
        <BentoTile
          size="full" tone="amber" label="New bet" icon="plus"
          caption="Call it now"
          onPress={() => navigation.navigate('CreateBet')}
        />
        </Rise>
        </View>
          }
        />

        {/* Row 3 — bets, or the first-run path into the social loop */}
        {feedError ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Couldn’t load your feed</Text>
            <Text style={styles.noticeBody}>{humanError(feedError)}</Text>
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
            <View />
          </>
        )}

        {!noGroups && !feedError && (bets.length === 0 ? (
          <View style={styles.firstRun}>
            <Text style={styles.section}>NEEDS YOU</Text>
            <Text style={styles.firstRunBody}>
              Nothing open right now. Start one and drag the group in.
            </Text>
            <Button label="Start a bet" onPress={() => navigation.navigate('CreateBet')} fullWidth />
          </View>
        ) : (
          <>
            <View style={styles.sectionRow}>
              <Text style={[styles.section, styles.sectionInRow]}>NEEDS YOU</Text>
              <Pressable
                onPress={() => navigation.navigate('AllBets')}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="See all bets"
              >
                <Text style={styles.sectionAction}>See all</Text>
              </Pressable>
            </View>
            {bets.map((bet, i) => (
              <Rise key={bet.id} index={i}>
                <BetCard
                  bet={bet}
                  onPress={(b) => navigation.navigate('BetDetail', { id: b.id })}
                />
              </Rise>
            ))}
          </>
        ))}
      </ScrollView>
      {/* Everything that does not earn a tile. A grid where the soundboard sits
          at the same weight as the ledger is a launcher; an overflow menu is
          where a familiar app keeps what you reach for occasionally. */}
      <ActionSheet
        visible={moreOpen}
        title="More"
        options={[
          { label: 'Pools', onPress: () => navigation.navigate('Pools') },
          { label: 'Join with a code', onPress: () => navigation.navigate('JoinGroup') },
          {
            label: 'Soundboard',
            onPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setBoard(true);
            },
          },
          { label: 'Settings', onPress: () => navigation.navigate('Settings') },
        ]}
        onDismiss={() => setMoreOpen(false)}
      />

    </ScreenBackground>
  );
}

// The "$" was hardcoded here, so the Ledger tile printed "+$0" beside a hero
// showing ₹. Signed, and in whatever currency the user actually picked.
const money = (cents: number, currency?: string | null) =>
  `${cents >= 0 ? '+' : '−'}${formatMoney(Math.abs(cents), currency)}`;

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
  strip: { gap: spacing[3] },
  // The rows used to be siblings of the feed and inherited the scroll view's
  // gap. They're one object now — it has to carry its own.
  bento: { gap: spacing[3] },
  col: {
    gap: spacing[3],
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -7,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: colors.semantic.disputed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: 'Barlow-Bold',
    fontSize: 9,
    color: colors.text.primary,
  },
  capTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(10,10,11,0.15)',
    marginTop: spacing[3],
    overflow: 'hidden',
  },
  capFill: {
    ...relief,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.text.inverse,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[1],
  },
  section: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    color: colors.semantic.awaiting,
    marginTop: spacing[2],
  },
  // The row owns the top spacing; the overline must not add its own or it
  // sits lower than the action beside it. flex:1 (rather than the row using
  // space-between) makes the overline absorb the slack, so a longer action like
  // "See all" is right-aligned inside the gutter instead of being pushed past
  // the screen edge and clipped.
  sectionInRow: { marginTop: 0, flex: 1 },
  sectionAction: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 12,
    color: colors.text.secondary,
    // No padding: it inflated the header row by ~24pt. The Pressable's hitSlop
    // carries the 44pt target instead, which costs no layout.
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
