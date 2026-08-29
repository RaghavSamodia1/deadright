import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { paper, spacing, radius } from '../tokens';
import { Avatar, Icon } from '../components';
import { getJarSummary } from '../api/jar';
import { getMyProfile } from '../api/profile';
import { getLedgerSummary } from '../api/ledger';
import { getMyGroups } from '../api/groups';
import { getUnreadCount } from '../api/notifications';
import { useQuery } from '../hooks/useQuery';
import { useCurrency } from '../hooks/useCurrency';
import { formatMoney } from '../lib/money';
import { plural } from '../lib/plural';

/**
 * Home, on paper.
 *
 * The editorial redesign: warm stock instead of near-black, a high-contrast
 * serif instead of Barlow, muted blocks of colour instead of saturated tiles,
 * and marginalia in a script face. It reads as a printed page rather than a
 * dashboard, which is the point — the app is about what people said they would
 * do, and paper is what you write that on.
 *
 * The mockup composes photographic cutouts into each block — a jar of notes, a
 * flexing arm, a hand throwing dice. Those are not in the repository and cannot
 * be invented, so every block here is built from type, rule and colour, and is
 * laid out to leave the cutout's space free. Dropping the images in later is an
 * <Image> per block, not a rebuild.
 */
export function PaperHomeScreen({ navigation }: any) {
  const currency = useCurrency();

  const { data: jarSummary } = useQuery(getJarSummary, {
    totalCents: 0,
    byCurrency: [] as { currency: string; cents: number }[],
    violationCount: 0,
    weekCount: 0,
  });
  const jarTotals = jarSummary.byCurrency ?? [];
  const jarCents = jarTotals[0]?.cents ?? 0;
  const jarCurrency = jarTotals[0]?.currency ?? currency;

  const { data: profile } = useQuery(getMyProfile, {
    handle: '',
    display_name: '',
    avatar_url: null,
    form_score: 500,
    current_streak: 0,
    best_streak: 0,
  } as any);

  const { data: summary } = useQuery(getLedgerSummary, {
    lifetimeCents: 0,
    thisMonthCents: 0,
    pendingCents: 0,
    lifetimeByCurrency: [] as { currency: string; cents: number }[],
    thisMonthByCurrency: [],
    pendingByCurrency: [],
  } as any);
  const ledgerCents = summary.lifetimeByCurrency?.[0]?.cents ?? 0;
  const ledgerCurrency = summary.lifetimeByCurrency?.[0]?.currency ?? currency;

  const { data: groups } = useQuery(getMyGroups, [] as any[]);
  const { data: unread } = useQuery(getUnreadCount, 0);

  // People you share a group with — the same derivation the roster screen uses,
  // since there is no friends table.
  const people = React.useMemo(() => {
    const byId = new Map<string, { id: string; handle: string; name: string; avatar: string | null }>();
    (groups as any[]).forEach((g) =>
      (g.members ?? []).forEach((m: any) => {
        if (!m.user_id || m.user_id === profile?.id || byId.has(m.user_id)) return;
        byId.set(m.user_id, {
          id: m.user_id,
          handle: m.profile?.handle ?? '',
          name: m.profile?.display_name ?? m.profile?.handle ?? 'Someone',
          avatar: m.profile?.avatar_url ?? null,
        });
      }),
    );
    return [...byId.values()];
  }, [groups, profile?.id]);

  const initials = (n: string) =>
    n.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?';

  const streak = profile.current_streak ?? 0;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Masthead */}
        <View style={styles.masthead}>
          <View style={styles.mastheadText}>
            <Text style={styles.wordmark} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              DeadRight
            </Text>
            <Text style={styles.tagline}>GOOD CALLS.{'\n'}MORE WINS.</Text>
            <View style={styles.rule} />
          </View>
          <View style={styles.mastheadActions}>
            <Pressable onPress={() => navigation.navigate('Search')} accessibilityLabel="Search" hitSlop={8}>
              <Icon name="search" size={22} color={paper.ink.primary} strokeWidth={1.8} />
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Alerts')} accessibilityLabel="Alerts" hitSlop={8}>
              <View>
                <Icon name="bell" size={22} color={paper.ink.primary} strokeWidth={1.8} />
                {unread > 0 && <View style={styles.dot} />}
              </View>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Profile')} accessibilityLabel="Your profile">
              <Avatar
                size="md"
                uri={profile.avatar_url ?? undefined}
                initials={initials(profile.display_name || profile.handle || 'You')}
                seed={profile.handle}
              />
            </Pressable>
          </View>
        </View>

        {/* Jar — the anchor of the page. */}
        <Pressable style={styles.jar} onPress={() => navigation.navigate('AllJars')}>
          <Text style={styles.overline}>JAR BALANCE</Text>
          <Text style={styles.jarAmount}>{formatMoney(jarCents, jarCurrency)}</Text>
          <View style={styles.linkRow}>
            <Text style={styles.link}>OPEN JAR</Text>
            <Text style={styles.arrow}>→</Text>
          </View>
          <View style={styles.jarLabel}>
            <Text style={styles.jarLabelText}>SMALL BETS.</Text>
            <Text style={styles.jarLabelText}>BIG STORIES.</Text>
          </View>
        </Pressable>

        <View style={styles.row}>
          {/* Form */}
          <Pressable
            style={[styles.block, styles.lavender, styles.half]}
            onPress={() => navigation.navigate('Form')}
          >
            <Text style={styles.overline}>FORM</Text>
            <Text style={styles.bigSerif}>{profile.form_score ?? 500}</Text>
            <Text style={styles.blockBody}>How you're{'\n'}doing lately</Text>
            <Text style={styles.arrow}>→</Text>
          </Pressable>

          {/* Streak */}
          <View style={[styles.block, styles.olive, styles.half]}>
            <Text style={styles.overline}>STREAK</Text>
            <Text style={styles.hugeSerif}>{streak}X</Text>
            <Text style={styles.blockBody}>Best: {profile.best_streak ?? 0}</Text>
            <Text style={styles.script}>let's{'\n'}break{'\n'}the tie.</Text>
          </View>
        </View>

        <View style={styles.row}>
          {/* Ledger */}
          <Pressable
            style={[styles.block, styles.receipt, styles.half]}
            onPress={() => navigation.navigate('Ledger')}
          >
            <Text style={styles.overline}>LEDGER</Text>
            <Text style={[styles.money, ledgerCents < 0 && styles.moneyDown]}>
              {ledgerCents >= 0 ? '+' : '−'}
              {formatMoney(Math.abs(ledgerCents), ledgerCurrency)}
            </Text>
            <View style={styles.linkRow}>
              <Text style={styles.link}>VIEW ALL</Text>
              <Text style={styles.arrow}>→</Text>
            </View>
          </Pressable>

          {/* Settle it */}
          <Pressable
            style={[styles.block, styles.card, styles.half]}
            onPress={() => navigation.navigate('Settle')}
          >
            <Text style={styles.headingScript}>SETTLE IT</Text>
            <View style={styles.ruleShort} />
            <Text style={styles.blockBody}>Can't agree?{'\n'}Let chance{'\n'}decide.</Text>
            <View style={styles.linkRow}>
              <Text style={styles.link}>PLAY A GAME</Text>
              <Text style={styles.arrow}>→</Text>
            </View>
          </Pressable>
        </View>

        {/* Your people */}
        <Pressable style={styles.people} onPress={() => navigation.navigate('Groups')}>
          <Text style={styles.overline}>YOUR PEOPLE</Text>
          <View style={styles.peopleCount}>
            <Text style={styles.bigSerif}>{people.length}</Text>
            <Text style={styles.blockBody}>
              {people.length === 1 ? 'friend in' : 'friends in'}{'\n'}your circle
            </Text>
          </View>
          <View style={styles.faces}>
            {people.slice(0, 4).map((p, i) => (
              <View key={p.id} style={[styles.face, i > 0 && styles.faceOverlap]}>
                <Avatar size="md" uri={p.avatar ?? undefined} initials={initials(p.name)} seed={p.handle || p.id} />
              </View>
            ))}
            {people.length > 4 && (
              <View style={[styles.face, styles.faceOverlap, styles.faceMore]}>
                <Text style={styles.faceMoreText}>+{people.length - 4}</Text>
              </View>
            )}
          </View>
          <View style={styles.linkRow}>
            <Text style={styles.link}>SEE ALL</Text>
            <Text style={styles.arrow}>→</Text>
          </View>
        </Pressable>

        {/* Pools */}
        <Pressable
          style={[styles.block, styles.lavender, styles.wide]}
          onPress={() => navigation.navigate('Pools')}
        >
          <Text style={styles.overline}>POOLS</Text>
          <Text style={styles.poolHeadline}>Make a bet.{'\n'}Share the link.{'\n'}Everyone's in.</Text>
          <View style={styles.linkRow}>
            <Text style={styles.link}>CREATE A POOL</Text>
            <Text style={styles.arrow}>→</Text>
          </View>
        </Pressable>

        {/* Record a transaction */}
        <Pressable style={styles.recordRow} onPress={() => navigation.navigate('RecordEntry')}>
          <View style={styles.recordIcon}>
            <Text style={styles.recordGlyph}>₹</Text>
          </View>
          <View style={styles.recordText}>
            <Text style={styles.recordTitle}>ADD / RECORD TRANSACTION</Text>
            <Text style={styles.recordBody}>Add money to jar or record a payment</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </Pressable>
      </ScrollView>

      {/* The primary action, floating clear of the page. */}
      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('CreateBet')}
        accessibilityRole="button"
        accessibilityLabel="New bet"
      >
        <Text style={styles.fabPlus}>+</Text>
        <Text style={styles.fabLabel}>NEW BET</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: paper.base },
  content: { padding: spacing.screenGutter, paddingBottom: 140, gap: spacing[3] },

  masthead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  mastheadText: { flex: 1 },
  wordmark: {
    fontFamily: 'PlayfairDisplay-Black',
    fontSize: 36,
    color: paper.ink.primary,
    letterSpacing: -1,
  },
  tagline: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 13,
    letterSpacing: 1.4,
    lineHeight: 18,
    color: paper.ink.primary,
    marginTop: 2,
  },
  rule: { height: 1.5, width: 96, backgroundColor: paper.ink.primary, marginTop: spacing[2] },
  mastheadActions: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingTop: 6 },
  dot: {
    position: 'absolute', top: -2, right: -2, width: 8, height: 8,
    borderRadius: 4, backgroundColor: paper.block.lavender,
    borderWidth: 1, borderColor: paper.ink.primary,
  },

  overline: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 1.6,
    color: paper.ink.primary,
  },

  jar: {
    backgroundColor: paper.card,
    borderRadius: radius.sm,
    padding: spacing[4],
    gap: 4,
    minHeight: 168,
  },
  jarAmount: {
    fontFamily: 'PlayfairDisplay-Black',
    fontSize: 40,
    color: paper.ink.primary,
    letterSpacing: -1,
  },
  jarLabel: {
    alignSelf: 'flex-start',
    backgroundColor: paper.base,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    marginTop: spacing[3],
  },
  jarLabelText: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 13,
    letterSpacing: 1.2,
    color: paper.ink.primary,
    lineHeight: 20,
  },

  row: { flexDirection: 'row', gap: spacing[3] },
  half: { flex: 1 },
  wide: { width: '100%' },
  block: { borderRadius: radius.sm, padding: spacing[4], gap: 4, minHeight: 132 },
  lavender: { backgroundColor: paper.block.lavender },
  olive: { backgroundColor: paper.block.olive },
  card: { backgroundColor: paper.card },
  receipt: { backgroundColor: paper.sunken },

  bigSerif: { fontFamily: 'PlayfairDisplay-Black', fontSize: 34, color: paper.ink.primary, letterSpacing: -0.5 },
  hugeSerif: { fontFamily: 'PlayfairDisplay-Black', fontSize: 50, color: paper.ink.primary, letterSpacing: -2 },
  blockBody: { fontFamily: 'Inter-Regular', fontSize: 13, lineHeight: 18, color: paper.ink.primary },
  script: {
    fontFamily: 'Caveat-Bold',
    fontSize: 22,
    lineHeight: 24,
    color: paper.ink.primary,
    alignSelf: 'flex-end',
    textAlign: 'right',
    marginTop: 'auto' as unknown as number,
  },
  headingScript: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    fontStyle: 'italic',
    letterSpacing: 0.5,
    color: paper.ink.primary,
  },
  ruleShort: { height: 1.5, width: 60, backgroundColor: paper.ink.primary, marginBottom: 6 },

  money: { fontFamily: 'PlayfairDisplay-Black', fontSize: 30, color: paper.block.money },
  moneyDown: { color: paper.mark.red },

  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 'auto' as unknown as number },
  link: { fontFamily: 'Barlow-SemiBold', fontSize: 11, letterSpacing: 1.4, color: paper.ink.primary },
  arrow: { fontFamily: 'Inter-Medium', fontSize: 15, color: paper.ink.primary },

  people: { backgroundColor: paper.card, borderRadius: radius.sm, padding: spacing[4], gap: 6 },
  peopleCount: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  faces: { flexDirection: 'row', alignItems: 'center', marginTop: spacing[2] },
  face: { borderRadius: 999, borderWidth: 2, borderColor: paper.card },
  faceOverlap: { marginLeft: -12 },
  faceMore: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: paper.base, borderColor: paper.ink.faint,
  },
  faceMoreText: { fontFamily: 'Inter-Medium', fontSize: 12, color: paper.ink.primary },

  poolHeadline: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 21,
    lineHeight: 27,
    color: paper.ink.primary,
    marginVertical: spacing[2],
  },

  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: paper.card,
    borderRadius: radius.sm,
    padding: spacing[4],
  },
  recordIcon: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1.5, borderColor: paper.ink.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  recordGlyph: { fontFamily: 'Inter-Medium', fontSize: 15, color: paper.ink.primary },
  recordText: { flex: 1 },
  recordTitle: { fontFamily: 'Barlow-SemiBold', fontSize: 12, letterSpacing: 1.2, color: paper.ink.primary },
  recordBody: { fontFamily: 'Inter-Regular', fontSize: 12, color: paper.ink.muted, marginTop: 2 },

  fab: {
    position: 'absolute',
    right: spacing.screenGutter,
    bottom: spacing[6],
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: paper.ink.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPlus: { fontFamily: 'Inter-Regular', fontSize: 24, color: paper.base, lineHeight: 27 },
  fabLabel: { fontFamily: 'Barlow-SemiBold', fontSize: 9, letterSpacing: 0.8, color: paper.base },
});
