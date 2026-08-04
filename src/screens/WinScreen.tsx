import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, Stamp, Button } from '../components';
import { undoResolution, getCredDelta } from '../api/resolution';
import { useAction } from '../hooks/useQuery';

// Peak — "CALLED IT" win moment. Mint, rotated stamp (the signature moment).
const UNDO_WINDOW_SECONDS = 300; // matches undo_resolution's 5-minute check

export function WinScreen({ navigation, route }: any) {
  const betId: string | undefined = route?.params?.id ?? route?.params?.betId;

  // Was a hardcoded 12, because nothing navigating here passed a number. Ask
  // for the real award and show nothing rather than a made-up figure.
  const [cred, setCred] = React.useState<number | null>(
    route?.params?.credGain ?? null,
  );
  React.useEffect(() => {
    if (!betId || cred !== null) return;
    let alive = true;
    getCredDelta(betId).then((d) => {
      if (alive && d !== null) setCred(d);
    });
    return () => {
      alive = false;
    };
  }, [betId, cred]);

  const { run: undo, loading: undoing } = useAction(undoResolution);
  const [secondsLeft, setSecondsLeft] = React.useState(UNDO_WINDOW_SECONDS);

  React.useEffect(() => {
    if (!betId) return;
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [betId]);

  return (
    <ScreenBackground tone="win">
      <View style={styles.root}>
        <View style={styles.center}>
          <Stamp label="CALLED IT" color={colors.text.inverse} rotate={-12} fontSize={60} />
          <Text style={styles.emoji}></Text>
          <Text style={styles.sub}>You were dead right.</Text>
          {cred !== null && (
            <View style={styles.credPill}>
              <Text style={styles.credText}>
                {cred >= 0 ? '+' : '−'}{Math.abs(cred)} Cred
              </Text>
            </View>
          )}
        </View>
        <View style={styles.footer}>
          <Button label="Rub it in" onPress={() => navigation.replace('ShareInvite')} variant="secondary" fullWidth />
          <Button label="Nice" onPress={() => navigation.popToTop?.() ?? navigation.navigate('Root')} fullWidth />

          {/* The backend allows undoing a resolution for 5 minutes; without
              this the window existed but was unreachable. */}
          {betId && secondsLeft > 0 && (
            <Text
              style={styles.undo}
              onPress={async () => {
                await undo(betId);
                navigation.popToTop?.() ?? navigation.navigate('Root');
              }}
            >
              {undoing ? 'Undoing…' : `Wrong call? Undo (${secondsLeft}s)`}
            </Text>
          )}
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.screenGutter, paddingBottom: spacing[6] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[4] },
  emoji: { fontSize: 56, marginTop: spacing[4] },
  sub: {
    fontFamily: 'Barlow-Bold',
    fontSize: 20,
    color: colors.text.inverse,
  },
  credPill: {
    backgroundColor: colors.text.inverse,
    borderRadius: 999,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
    marginTop: spacing[2],
  },
  credText: {
    fontFamily: 'Barlow-Black',
    fontSize: 16,
    color: colors.semantic.win,
    letterSpacing: 0.5,
  },
  footer: { gap: spacing[3] },
  undo: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 13,
    color: colors.text.inverse,
    textAlign: 'center',
    opacity: 0.75,
    paddingVertical: spacing[3], // keeps the tap target at 44pt
  },
});
