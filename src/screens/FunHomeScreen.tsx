import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, relief, radius } from '../tokens';
import {
  ScreenBackground,
  NavHeader,
  BentoTile,
  Rise,
  Swap,
  SoundBoard,
  BetCard,
  Icon,
  Button,
  type BetCardData,
} from '../components';
import {
  CookieJarHeroTile,
  FunFormTile,
  FunStreakTile,
  FunSquadTile,
  FunLedgerTile,
  FunSettleTile,
  FunActionRow,
} from '../components/FunBento';
import { getFeed } from '../api/bets';
import { getMyProfile } from '../api/profile';
import { getLedgerSummary } from '../api/ledger';
import { getMyGroups } from '../api/groups';
import { getUnreadCount } from '../api/notifications';
import { isBackendConfigured } from '../lib/supabase';
import { getJarSummary } from '../api/jar';
import { useQuery } from '../hooks/useQuery';
import { useRealtime } from '../hooks/useRealtime';
import { uidOrNull } from '../lib/supabase';
import { toBetCard } from '../lib/mappers';
import { humanError } from '../lib/errors';
import { useCurrency } from '../hooks/useCurrency';
import { formatMoney, formatTotals, DEFAULT_JAR_CAP_CENTS } from '../lib/money';

/**
 * FunHomeScreen — Fork of HomeScreen featuring:
 * - Playful, illustrated Cookie Jar hero tile with cookies, glass reflections, and lid
 * - Energetic, colorful Bento tiles (Arcade Form, Ember Streak, Clubhouse Squad, 3D Dice, Candy Button)
 * - Design Switcher: toggles between "⚡ Fun Bento" and "🏛️ Classic Bento" in real-time
 * - Preserves the main HomeScreen.tsx completely intact as baseline
 */
export function FunHomeScreen({ navigation }: any) {
  const currency = useCurrency();
  const [bentoMode, setBentoMode] = useState<'fun' | 'classic'>('fun');

  // Easter egg soundboard on long-press of the wordmark
  const [board, setBoard] = useState(false);

  const { data: jarSummary, refetch: refetchJar } = useQuery(getJarSummary, {
    byCurrency: [],
    totalCents: 0,
    violationCount: 0,
    weekCount: 0,
  });

  const jarTotals = jarSummary.byCurrency ?? [];
  const jarMixed = jarTotals.length > 1;
  const jarCurrency = jarTotals[0]?.currency ?? currency;
  const jarTotal = (jarTotals[0]?.cents ?? 0) / 100;

  const { data: profile } = useQuery(getMyProfile, {
    handle: '',
    display_name: '',
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

  const { data: groups, refetch: refetchGroups } = useQuery(getMyGroups, [] as any[]);
  const noGroups = isBackendConfigured && groups.length === 0;

  const jarCap =
    ((groups ?? []).reduce(
      (sum: number, g: any) => sum + (g?.jar_cap_cents ?? DEFAULT_JAR_CAP_CENTS),
      0,
    ) || DEFAULT_JAR_CAP_CENTS) / 100;

  const { data: unread, refetch: refetchUnread } = useQuery(getUnreadCount, 0);
  useRealtime('notifications', refetchUnread);
  useRealtime('bets', refetchFeed);
  useRealtime('bet_participants', refetchFeed);
  useRealtime('group_members', refetchGroups);

  useFocusEffect(
    useCallback(() => {
      refetchFeed();
      refetchGroups();
      refetchJar();
    }, [refetchFeed, refetchGroups, refetchJar]),
  );

  const toggleMode = (mode: 'fun' | 'classic') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBentoMode(mode);
  };

  return (
    <ScreenBackground tone="base">
      <NavHeader
        variant="home"
        showAvatar
        avatarInitials={(profile.display_name ?? 'You').slice(0, 2).toUpperCase()}
        avatarUri={profile.avatar_url ?? undefined}
        avatarSeed={profile.handle || undefined}
        onAvatarPress={() => navigation.navigate('Profile')}
        onBrandLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setBoard(true);
        }}
        rightActions={[
          {
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
            accessibilityLabel: unread > 0 ? `Alerts, ${unread} unread` : 'Alerts',
          },
        ]}
      />

      {/* Mode Switcher Banner */}
      <View style={styles.modeSwitcherRow}>
        <View style={styles.modeSwitcherContainer}>
          <Pressable
            onPress={() => toggleMode('fun')}
            style={[styles.modeTab, bentoMode === 'fun' && styles.modeTabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: bentoMode === 'fun' }}
          >
            <Text style={[styles.modeTabText, bentoMode === 'fun' && styles.modeTabTextActive]}>
              ⚡ Fun Bento
            </Text>
          </Pressable>
          <Pressable
            onPress={() => toggleMode('classic')}
            style={[styles.modeTab, bentoMode === 'classic' && styles.modeTabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: bentoMode === 'classic' }}
          >
            <Text style={[styles.modeTabText, bentoMode === 'classic' && styles.modeTabTextActive]}>
              🏛️ Classic
            </Text>
          </Pressable>
        </View>
      </View>

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
          b={
            <SoundBoard
              active={board}
              onClose={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setBoard(false);
              }}
            />
          }
          a={
            bentoMode === 'fun' ? (
              // ---------------------------------------------------------------
              // ⚡ THE NEW FUN & COLORFUL BENTO GRID
              // ---------------------------------------------------------------
              <View style={styles.bento}>
                {/* Row 1 — Glass Cookie Jar Hero + Arcade Form & Fiery Streak */}
                <Rise index={0}>
                  <View style={styles.row}>
                    <CookieJarHeroTile
                      total={jarTotal}
                      currency={jarCurrency}
                      formatValue={(n) => formatMoney(Math.round(n * 100), jarCurrency)}
                      weekCount={jarSummary.weekCount}
                      violationCount={jarSummary.violationCount}
                      cap={jarCap}
                      isMixed={jarMixed}
                      moreCount={jarTotals.length - 1}
                      onPress={() => navigation.navigate('AllJars')}
                    />
                    <View style={styles.col}>
                      <FunFormTile
                        score={profile.form_score}
                        onPress={() => navigation.navigate('Form')}
                      />
                      <FunStreakTile
                        currentStreak={profile.current_streak}
                        bestStreak={profile.best_streak}
                        onPress={() => navigation.navigate('Profile')}
                      />
                    </View>
                  </View>
                </Rise>

                {/* Row 2 — The Squad Feature + Neon Ledger & 3D Dice */}
                <Rise index={1}>
                  <View style={styles.row}>
                    <FunSquadTile
                      count={groups.length}
                      onPress={() => navigation.navigate('Groups')}
                    />
                    <View style={styles.col}>
                      <FunLedgerTile
                        amountText={money(ledgerCents, ledgerCurrency)}
                        isPositive={ledgerCents >= 0}
                        onPress={() => navigation.navigate('Ledger')}
                      />
                      <FunSettleTile onPress={() => navigation.navigate('Settle')} />
                    </View>
                  </View>
                </Rise>

                {/* Row 3 — 3D Candy "New Bet" + Confetti "Pools" */}
                <Rise index={2}>
                  <FunActionRow
                    onCreateBet={() => navigation.navigate('CreateBet')}
                    onPools={() => navigation.navigate('Pools')}
                  />
                </Rise>
              </View>
            ) : (
              // ---------------------------------------------------------------
              // 🏛️ CLASSIC BASELINE BENTO (Identical to original HomeScreen)
              // ---------------------------------------------------------------
              <View style={styles.bento}>
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
                        jarMixed ? `+ ${formatTotals(jarTotals.slice(1))} more` : 'Open the jar'
                      }
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
                        size="stat"
                        tone="violet-tint"
                        countUp={profile.form_score}
                        label="Form"
                        caption="Details"
                        onPress={() => navigation.navigate('Form')}
                      />
                      <BentoTile
                        size="stat"
                        tone="flame"
                        value={`${profile.current_streak}×`}
                        label="Streak"
                        caption={`Best: ${profile.best_streak}`}
                      />
                    </View>
                  </View>
                </Rise>

                <Rise index={1}>
                  <View style={styles.row}>
                    <BentoTile
                      size="feature"
                      tone="navy"
                      icon="users"
                      value={`${groups.length}`}
                      label="Groups & people"
                      caption="Open them"
                      onPress={() => navigation.navigate('Groups')}
                    />
                    <View style={styles.col}>
                      <BentoTile
                        size="nav"
                        tone={ledgerCents >= 0 ? 'mint-tint' : 'coral-tint'}
                        value={money(ledgerCents, ledgerCurrency)}
                        label="Ledger"
                        icon="ledger"
                        onPress={() => navigation.navigate('Ledger')}
                      />
                      <BentoTile
                        size="nav"
                        tone="teal-tint"
                        label="Settle it"
                        icon="dice"
                        onPress={() => navigation.navigate('Settle')}
                      />
                    </View>
                  </View>
                </Rise>

                <Rise index={2}>
                  <View style={styles.row}>
                    <BentoTile
                      size="band"
                      tone="amber"
                      label="New bet"
                      icon="plus"
                      caption="Call it now"
                      onPress={() => navigation.navigate('CreateBet')}
                    />
                    <BentoTile
                      size="stat"
                      tone="violet-tint"
                      label="Pools"
                      icon="party"
                      onPress={() => navigation.navigate('Pools')}
                    />
                  </View>
                </Rise>
              </View>
            )
          }
        />

        {/* Bets Feed & Social Section */}
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
              Make a group with your friends, or join theirs with a code. Everything — bets, the
              Cookie Jar, the ledger — lives inside a group.
            </Text>
            <Button
              label="Create a group"
              onPress={() => navigation.navigate('CreateGroup')}
              fullWidth
            />
            <Button
              label="I have an invite code"
              onPress={() => navigation.navigate('JoinGroup')}
              variant="secondary"
              fullWidth
            />
          </View>
        ) : null}

        {!noGroups &&
          !feedError &&
          (bets.length === 0 ? (
            <View style={styles.firstRun}>
              <Text style={styles.section}>NEEDS YOU</Text>
              <Text style={styles.firstRunBody}>
                Nothing open right now. Start one and drag the group in.
              </Text>
              <Button
                label="Start a bet"
                onPress={() => navigation.navigate('CreateBet')}
                fullWidth
              />
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
    </ScreenBackground>
  );
}

const money = (cents: number, currency?: string | null) =>
  `${cents >= 0 ? '+' : '−'}${formatMoney(Math.abs(cents), currency)}`;

const styles = StyleSheet.create({
  modeSwitcherRow: {
    paddingHorizontal: spacing.screenGutter,
    marginBottom: spacing[2],
    alignItems: 'center',
  },
  modeSwitcherContainer: {
    flexDirection: 'row',
    backgroundColor: '#151B26',
    borderRadius: radius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modeTab: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: radius.full,
  },
  modeTabActive: {
    backgroundColor: colors.semantic.awaiting,
  },
  modeTabText: {
    fontFamily: 'Barlow-Bold',
    fontSize: 11,
    color: colors.text.secondary,
    letterSpacing: 0.4,
  },
  modeTabTextActive: {
    color: '#0A0A0B',
  },
  content: {
    padding: spacing.screenGutter,
    gap: spacing[3],
    paddingBottom: spacing[8],
  },
  row: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  bento: {
    gap: spacing[3],
  },
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
  sectionInRow: {
    marginTop: 0,
    flex: 1,
  },
  sectionAction: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 12,
    color: colors.text.secondary,
  },
  notice: {
    backgroundColor: colors.bg.surface1,
    borderRadius: radius.md,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  noticeTitle: {
    fontFamily: 'Barlow-Bold',
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 4,
  },
  noticeBody: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.text.secondary,
  },
  firstRun: {
    backgroundColor: colors.bg.surface1,
    borderRadius: radius.md,
    padding: spacing[4],
    gap: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  firstRunTitle: {
    fontFamily: 'Barlow-Bold',
    fontSize: 20,
    color: colors.text.primary,
  },
  firstRunBody: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
});
