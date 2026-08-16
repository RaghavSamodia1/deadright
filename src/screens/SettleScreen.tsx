import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';
import { colors, radius, spacing, spring } from '../tokens';
import {
  ScreenBackground,
  NavHeader,
  SegmentedControl,
  TextInput,
  Button,
  Icon,
} from '../components';

/**
 * Tiebreakers.
 *
 * Not arcade games — the things you actually reach for mid-argument when a bet
 * can't be settled by fact, or when somebody has to be picked. They deliberately
 * record nothing: a coin toss is a way to stop arguing, not a result the ledger
 * should remember. Anything worth keeping is already a bet.
 */
type Game = 'coin' | 'dice' | 'straw' | 'odds';

export function SettleScreen({ navigation }: any) {
  const [game, setGame] = useState<Game>('coin');

  return (
    <ScreenBackground tone="base">
      <NavHeader variant="back" title="Settle it" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <SegmentedControl
          segments={[
            { value: 'coin' as Game, label: 'Coin' },
            { value: 'dice' as Game, label: 'Dice' },
            { value: 'straw' as Game, label: 'Straw' },
            { value: 'odds' as Game, label: 'Odds' },
          ]}
          value={game}
          onChange={setGame}
        />

        {game === 'coin' && <CoinToss />}
        {game === 'dice' && <DiceRoll />}
        {game === 'straw' && <ShortStraw />}
        {game === 'odds' && <OddsAre />}

        <Text style={styles.foot}>
          Nothing here is recorded. If it's worth remembering, make it a bet.
        </Text>
      </ScrollView>
    </ScreenBackground>
  );
}

/** Shared: a big result face plus the button that rolls it. */
function Stage({
  children,
  label,
  cta,
  onPlay,
  busy,
}: {
  children: React.ReactNode;
  label: string;
  cta: string;
  onPlay: () => void;
  busy: boolean;
}) {
  return (
    <View style={styles.stage}>
      <View style={styles.face}>{children}</View>
      <Text style={styles.result}>{label}</Text>
      <Button label={cta} onPress={onPlay} disabled={busy} fullWidth />
    </View>
  );
}

// ── Coin ─────────────────────────────────────────────────────────────────────
function CoinToss() {
  const reduced = useReducedMotion();
  const [side, setSide] = useState<'Heads' | 'Tails' | null>(null);
  const [busy, setBusy] = useState(false);
  const spin = useSharedValue(0);

  const style = useAnimatedStyle(() => ({
    transform: [{ perspective: 700 }, { rotateX: `${spin.value}deg` }],
  }));

  const toss = () => {
    const result: 'Heads' | 'Tails' = Math.random() < 0.5 ? 'Heads' : 'Tails';
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (reduced) return setSide(result);

    setBusy(true);
    setSide(null);
    // Land on a whole number of flips so the face is square to the reader, plus
    // a half turn for tails — the coin stops showing what it actually landed on.
    const turns = 5 * 360 + (result === 'Tails' ? 180 : 0);
    spin.value = 0;
    spin.value = withTiming(turns, { duration: 1150, easing: Easing.out(Easing.cubic) }, () => {
      spin.value = spin.value % 360;
    });
    setTimeout(() => {
      setSide(result);
      setBusy(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1150);
  };

  return (
    <Stage label={side ?? 'Call it in the air'} cta="Toss" onPlay={toss} busy={busy}>
      <Animated.View style={[styles.coin, style]}>
        <Text style={styles.coinFace}>{side === 'Tails' ? 'T' : 'H'}</Text>
      </Animated.View>
    </Stage>
  );
}

// ── Dice ─────────────────────────────────────────────────────────────────────
const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 25], [72, 25], [28, 50], [72, 50], [28, 75], [72, 75]],
};

function Die({ value }: { value: number }) {
  return (
    <Svg width="76" height="76" viewBox="0 0 100 100">
      {(PIPS[value] ?? PIPS[1]).map(([cx, cy], i) => (
        <Circle key={i} cx={cx} cy={cy} r="8.5" fill={colors.bg.base} />
      ))}
    </Svg>
  );
}

function DiceRoll() {
  const reduced = useReducedMotion();
  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const [rolled, setRolled] = useState(false);
  const [busy, setBusy] = useState(false);
  const shake = useSharedValue(0);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: shake.value }, { rotate: `${shake.value * 0.6}deg` }],
  }));

  const roll = () => {
    const next: [number, number] = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (reduced) {
      setDice(next);
      setRolled(true);
      return;
    }
    setBusy(true);
    shake.value = withRepeat(
      withSequence(
        withTiming(-7, { duration: 70 }),
        withTiming(7, { duration: 70 }),
      ),
      5,
      true,
    );
    // Tumble through faces while it shakes, so it reads as rolling rather than
    // as a number that simply changed.
    const tumble = setInterval(() => {
      setDice([1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]);
    }, 90);
    setTimeout(() => {
      clearInterval(tumble);
      shake.value = withTiming(0, { duration: 90 });
      setDice(next);
      setRolled(true);
      setBusy(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 760);
  };

  const total = dice[0] + dice[1];
  return (
    <Stage
      label={rolled ? `${total}` : 'Roll for it'}
      cta="Roll"
      onPlay={roll}
      busy={busy}
    >
      <Animated.View style={[styles.diceRow, style]}>
        <View style={styles.die}><Die value={dice[0]} /></View>
        <View style={styles.die}><Die value={dice[1]} /></View>
      </Animated.View>
    </Stage>
  );
}

// ── Short straw ──────────────────────────────────────────────────────────────
function ShortStraw() {
  const [raw, setRaw] = useState('');
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const names = raw
    .split(/[\n,]/)
    .map((n) => n.trim())
    .filter(Boolean);

  const draw = () => {
    if (names.length < 2) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBusy(true);
    // Cycle the names before settling — being seen to consider everyone is what
    // makes a random pick feel fair to the person it lands on.
    let n = 0;
    const cycle = setInterval(() => {
      setPicked(names[n % names.length]);
      n += 1;
    }, 85);
    setTimeout(() => {
      clearInterval(cycle);
      setPicked(names[Math.floor(Math.random() * names.length)]);
      setBusy(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }, 900);
  };

  return (
    <View style={styles.stage}>
      <TextInput
        label="Who's in it"
        placeholder={'Marcus, Abi, Priya'}
        value={raw}
        onChangeText={(t) => {
          setRaw(t);
          setPicked(null);
        }}
        multiline
      />
      <View style={styles.strawFace}>
        <Text style={styles.strawName} numberOfLines={1}>
          {picked ?? '—'}
        </Text>
        <Text style={styles.result}>
          {picked && !busy ? 'draws the short straw' : `${names.length} in the hat`}
        </Text>
      </View>
      <Button
        label="Draw"
        onPress={draw}
        disabled={busy || names.length < 2}
        fullWidth
      />
    </View>
  );
}

// ── Odds are ─────────────────────────────────────────────────────────────────
function OddsAre() {
  const [range, setRange] = useState('10');
  const [mine, setMine] = useState('');
  const [theirs, setTheirs] = useState('');
  const [done, setDone] = useState(false);

  const n = Math.max(2, Math.min(100, parseInt(range, 10) || 0));
  const a = parseInt(mine, 10);
  const b = parseInt(theirs, 10);
  const ready = a >= 1 && a <= n && b >= 1 && b <= n;
  const match = done && a === b;

  return (
    <View style={styles.stage}>
      <Text style={styles.blurb}>
        Name a dare and a range. You both pick a number in secret — if they match,
        the dare is on.
      </Text>
      <TextInput label="Range (1 to…)" placeholder="10" keyboardType="number-pad" value={range} onChangeText={setRange} />
      <View style={styles.pickRow}>
        <View style={styles.pickCol}>
          <TextInput label="Your number" placeholder="1" keyboardType="number-pad" value={mine} onChangeText={(t) => { setMine(t); setDone(false); }} secureTextEntry />
        </View>
        <View style={styles.pickCol}>
          <TextInput label="Theirs" placeholder="1" keyboardType="number-pad" value={theirs} onChangeText={(t) => { setTheirs(t); setDone(false); }} secureTextEntry />
        </View>
      </View>

      {done && (
        <View style={[styles.oddsFace, match && styles.oddsHit]}>
          <Text style={[styles.oddsText, match && styles.oddsHitText]}>
            {match ? `Both said ${a}. It's on.` : `${a} and ${b}. Off the hook.`}
          </Text>
        </View>
      )}

      <Button
        label="Reveal"
        onPress={() => {
          Haptics.notificationAsync(
            a === b
              ? Haptics.NotificationFeedbackType.Warning
              : Haptics.NotificationFeedbackType.Success,
          );
          setDone(true);
        }}
        disabled={!ready}
        fullWidth
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenGutter, gap: spacing[4], paddingBottom: spacing[8] },
  stage: { gap: spacing[4], alignItems: 'stretch' },
  face: { alignItems: 'center', justifyContent: 'center', minHeight: 168 },
  result: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  blurb: { fontFamily: 'Inter-Regular', fontSize: 13.5, lineHeight: 20, color: colors.text.secondary },

  coin: {
    width: 132,
    height: 132,
    borderRadius: 999,
    backgroundColor: colors.semantic.awaiting,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinFace: {
    fontFamily: 'Barlow-Black',
    fontSize: 58,
    color: colors.bg.base,
    includeFontPadding: false,
  },

  diceRow: { flexDirection: 'row', gap: spacing[3] },
  die: {
    width: 96,
    height: 96,
    borderRadius: radius.lg,
    backgroundColor: colors.semantic.awaiting,
    alignItems: 'center',
    justifyContent: 'center',
  },

  strawFace: { alignItems: 'center', gap: 6, minHeight: 96, justifyContent: 'center' },
  strawName: {
    fontFamily: 'Barlow-Black',
    fontSize: 38,
    letterSpacing: -1,
    color: colors.text.primary,
    includeFontPadding: false,
  },

  pickRow: { flexDirection: 'row', gap: spacing[3] },
  pickCol: { flex: 1 },
  oddsFace: {
    backgroundColor: colors.bg.surface1,
    borderRadius: radius.md,
    padding: spacing[4],
  },
  oddsHit: { backgroundColor: colors.semantic.awaiting },
  oddsText: { fontFamily: 'Barlow-Bold', fontSize: 17, color: colors.text.primary, textAlign: 'center' },
  oddsHitText: { color: colors.bg.base },

  foot: {
    fontFamily: 'Inter-Regular',
    fontSize: 12.5,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing[2],
  },
});
