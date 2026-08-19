import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
  withSequence,
  withSpring,
  withRepeat,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Accelerometer } from 'expo-sensors';
import Svg, {
  Circle,
  Rect,
  Line,
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';
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
type Game = 'coin' | 'dice' | 'picker' | 'odds';

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
            { value: 'picker' as Game, label: 'Picker' },
            { value: 'odds' as Game, label: 'Odds' },
          ]}
          value={game}
          onChange={setGame}
        />

        {game === 'coin' && <CoinToss />}
        {game === 'dice' && <DiceRoll />}
        {game === 'picker' && <RandomPicker />}
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
/**
 * You flick it.
 *
 * A button that plays an animation at you is a video; a coin you throw is a
 * coin. The flick carries through: how hard you send it decides how long it
 * spins and how high it goes, so two tosses never look the same and a limp
 * flick just drops back into your hand without deciding anything.
 *
 * The result is drawn before the animation starts and the spin is snapped to a
 * whole number of turns plus a half for tails, so the face that lands is the
 * face that won — it is never a lie told after the fact.
 */
function CoinToss() {
  const reduced = useReducedMotion();
  const [side, setSide] = useState<'Heads' | 'Tails' | null>(null);
  const [busy, setBusy] = useState(false);

  const spin = useSharedValue(0);
  const lift = useSharedValue(0);
  const grab = useSharedValue(0);

  const land = (result: 'Heads' | 'Tails') => {
    setSide(result);
    setBusy(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Plain JS, not a worklet: it needs setTimeout and setState, and neither is
  // safe on the UI runtime. The gesture hands off with runOnJS. Shared values
  // are writable from either side, so the animation still starts from here.
  const launch = (power: number) => {
    const result: 'Heads' | 'Tails' = Math.random() < 0.5 ? 'Heads' : 'Tails';
    if (reduced) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSide(result);
      return;
    }
    // 3 turns for a nudge, up to 9 for a proper throw.
    const turns = Math.round(3 + Math.min(6, power * 6));
    // Capped so the coin stays on screen. It was clearing the top of the frame
    // on a hard flick, and a coin you cannot see has stopped being a toss and
    // started being a bug.
    const height = 130 + power * 110;
    const up = 380 + power * 220;
    const down = up * 1.15;

    spin.value = 0;
    spin.value = withSequence(
      withTiming(turns * 360 + (result === 'Tails' ? 180 : 0), {
        duration: up + down,
        easing: Easing.out(Easing.quad),
      }),
    );
    lift.value = withSequence(
      withTiming(-height, { duration: up, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: down, easing: Easing.bounce }),
    );
    setBusy(true);
    setSide(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => land(result), up + down);
  };

  // Reduce Motion shortens the animation; it must not take the interaction
  // away. Someone with it switched on still gets to flick the coin — the coin
  // just decides straight away instead of arcing across the screen.
  const fling = Gesture.Pan()
    .enabled(!busy)
    .onUpdate((e) => {
      // Winding up: the coin follows your thumb down, and resists a little so
      // it feels weighted rather than stuck to the finger.
      grab.value = Math.max(-30, Math.min(70, e.translationY * 0.55));
    })
    .onEnd((e) => {
      const power = Math.min(1, Math.max(0, -e.velocityY / 2600));
      if (power > 0.06) {
        grab.value = withTiming(0, { duration: 90 });
        runOnJS(launch)(power);
      } else {
        // Not enough in it. Nothing is decided by a half-hearted flick.
        grab.value = withSpring(0, spring.fast);
      }
    });

  // The button is still there for anyone who does not discover the gesture, or
  // who has motion turned down.
  const tapToss = () => launch(0.55);

  const style = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { translateY: lift.value + grab.value },
      { rotateX: `${spin.value}deg` },
      { scale: 1 - grab.value * 0.0012 },
    ],
  }));

  return (
    <Stage
      label={side ?? (busy ? '' : 'Flick it')}
      cta="Toss"
      onPlay={tapToss}
      busy={busy}
    >
      <GestureDetector gesture={fling}>
        <Animated.View style={[styles.coin, style]}>
          <CoinFace letter={side === 'Tails' ? 'T' : 'H'} />
        </Animated.View>
      </GestureDetector>
    </Stage>
  );
}

/**
 * A struck coin rather than a flat disc: a milled rim, a radial gradient that
 * puts the light source top-left, and an inset field line. A circle of solid
 * amber reads as a placeholder for a coin — this reads as one.
 */
function CoinFace({ letter }: { letter: string }) {
  const ticks = Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2;
    const r1 = 62;
    const r2 = 68;
    return {
      x1: 70 + Math.cos(a) * r1,
      y1: 70 + Math.sin(a) * r1,
      x2: 70 + Math.cos(a) * r2,
      y2: 70 + Math.sin(a) * r2,
    };
  });

  return (
    <View style={styles.coinWrap}>
      <Svg width={140} height={140} viewBox="0 0 140 140">
        <Defs>
          <RadialGradient id="coinFace" cx="36%" cy="30%" r="78%">
            <Stop offset="0" stopColor="#FFEFBE" />
            <Stop offset="0.55" stopColor="#F7C846" />
            <Stop offset="1" stopColor="#C08A22" />
          </RadialGradient>
          <LinearGradient id="coinRim" x1="0" y1="0" x2="0.3" y2="1">
            <Stop offset="0" stopColor="#FFDD7A" />
            <Stop offset="1" stopColor="#96660F" />
          </LinearGradient>
        </Defs>

        <Circle cx="70" cy="70" r="69" fill="url(#coinRim)" />
        <G opacity={0.45}>
          {ticks.map((t, i) => (
            <Line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="#7A5209" strokeWidth="2" />
          ))}
        </G>
        <Circle cx="70" cy="70" r="61" fill="url(#coinFace)" />
        <Circle cx="70" cy="70" r="52" fill="none" stroke="#A87A1B" strokeWidth="1.5" opacity={0.45} />
      </Svg>
      <Text style={styles.coinFace}>{letter}</Text>
    </View>
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

/**
 * Gradient ids are per-Svg, but two dice sit side by side and a duplicate id
 * would have them share one gradient — hence the suffix.
 */
function Die({ value, id }: { value: number; id: string }) {
  const body = `body${id}`;
  const pip = `pip${id}`;
  return (
    <Svg width="94" height="94" viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id={body} x1="0" y1="0" x2="0.8" y2="1">
          <Stop offset="0" stopColor="#FFEFBE" />
          <Stop offset="0.45" stopColor="#F7C846" />
          <Stop offset="1" stopColor="#CE982A" />
        </LinearGradient>
        {/* Light from the same corner as the coin, so the two read as one set */}
        <RadialGradient id={pip} cx="34%" cy="28%" r="85%">
          <Stop offset="0" stopColor="#4A4636" />
          <Stop offset="1" stopColor="#08080A" />
        </RadialGradient>
      </Defs>

      <Rect x="2" y="2" width="96" height="96" rx="21" fill={`url(#${body})`} />
      <Rect
        x="4.5" y="4.5" width="91" height="91" rx="18.5"
        fill="none" stroke="#FFF6D6" strokeWidth="2.5" opacity={0.5}
      />
      {(PIPS[value] ?? PIPS[1]).map(([cx, cy], i) => (
        <G key={i}>
          <Circle cx={cx} cy={cy + 0.8} r="9" fill="#FFE9A8" opacity={0.5} />
          <Circle cx={cx} cy={cy} r="9" fill={`url(#${pip})`} />
        </G>
      ))}
    </Svg>
  );
}

function DiceRoll() {
  const reduced = useReducedMotion();
  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const [rolled, setRolled] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = React.useRef(false);

  const throwX = useSharedValue(0);
  const throwY = useSharedValue(0);
  const tumble = useSharedValue(0);
  const settle = useSharedValue(1);

  const roll = React.useCallback((power = 0.6) => {
    if (busyRef.current) return;
    const next: [number, number] = [
      1 + Math.floor(Math.random() * 6),
      1 + Math.floor(Math.random() * 6),
    ];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (reduced) {
      setDice(next);
      setRolled(true);
      return;
    }

    busyRef.current = true;
    setBusy(true);
    const flight = 380 + power * 260;

    // Thrown out and back rather than shaken in place: dice that travel read as
    // dice, dice that vibrate read as a loading spinner.
    throwY.value = withSequence(
      withTiming(-90 - power * 90, { duration: flight * 0.45, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: flight * 0.55, easing: Easing.bounce }),
    );
    throwX.value = withSequence(
      withTiming((Math.random() - 0.5) * 90 * power, { duration: flight * 0.45 }),
      withSpring(0, spring.emphasis),
    );
    tumble.value = 0;
    tumble.value = withTiming(720 + power * 720, { duration: flight, easing: Easing.out(Easing.cubic) });
    settle.value = withSequence(
      withTiming(1.1, { duration: flight * 0.4 }),
      withSpring(1, spring.celebration),
    );

    const faces = setInterval(() => {
      setDice([1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]);
    }, 80);

    setTimeout(() => {
      clearInterval(faces);
      setDice(next);
      setRolled(true);
      setBusy(false);
      busyRef.current = false;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, flight);
  }, [reduced]);

  // Shake the phone. The threshold is deliberately high — a phone jostled in a
  // pocket or set down on a table should not decide anything.
  React.useEffect(() => {
    if (reduced) return;
    Accelerometer.setUpdateInterval(120);
    let lastShake = 0;
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const force = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();
      if (force > 2.2 && now - lastShake > 1200) {
        lastShake = now;
        roll(Math.min(1, (force - 2.2) / 1.6));
      }
    });
    return () => sub.remove();
  }, [roll, reduced]);

  const fling = Gesture.Pan()
    .enabled(!busy)
    .onEnd((e) => {
      const power = Math.min(1, Math.hypot(e.velocityX, e.velocityY) / 2600);
      if (power > 0.08) runOnJS(roll)(power);
    });

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: throwX.value },
      { translateY: throwY.value },
      { rotate: `${tumble.value}deg` },
      { scale: settle.value },
    ],
  }));

  const total = dice[0] + dice[1];
  return (
    <Stage
      label={rolled && !busy ? `${total}` : busy ? '' : 'Throw them, or shake the phone'}
      cta="Roll"
      onPlay={() => roll(0.6)}
      busy={busy}
    >
      <GestureDetector gesture={fling}>
        <Animated.View style={[styles.diceRow, style]}>
          <Die value={dice[0]} id="a" />
          <Die value={dice[1]} id="b" />
        </Animated.View>
      </GestureDetector>
    </Stage>
  );
}

// ── Random picker ────────────────────────────────────────────────────────────
function RandomPicker() {
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
      <View style={styles.pickFace}>
        <Text style={styles.pickName} numberOfLines={1}>
          {picked ?? '—'}
        </Text>
        <Text style={styles.result}>
          {picked && !busy ? 'gets picked' : `${names.length} in the running`}
        </Text>
      </View>
      <Button
        label="Pick"
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
  face: { alignItems: 'center', justifyContent: 'center', minHeight: 210 },
  result: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  blurb: { fontFamily: 'Inter-Regular', fontSize: 13.5, lineHeight: 20, color: colors.text.secondary },

  coin: { width: 140, height: 140 },
  coinWrap: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  coinFace: {
    position: 'absolute',
    fontFamily: 'Barlow-Black',
    fontSize: 54,
    color: '#6B4A0C',
    includeFontPadding: false,
  },

  diceRow: { flexDirection: 'row', gap: spacing[3] },


  pickFace: { alignItems: 'center', gap: 6, minHeight: 96, justifyContent: 'center' },
  pickName: {
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
