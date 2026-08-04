import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import { ScreenBackground, NavHeader, Button } from '../components';
import { joinSide } from '../api/bets';
import { useAction } from '../hooks/useQuery';
import { isBackendConfigured } from '../lib/supabase';
import { humanError } from '../lib/errors';

type Side = 'a' | 'b' | null;

// Side selection sheet — pick which side of a bet you're on before it locks.
export function SideSelectionScreen({ navigation, route }: any) {
  const title = route?.params?.title ?? 'Arsenal finish top 4 this season';
  const betId = route?.params?.id ?? route?.params?.betId;
  const [side, setSide] = useState<Side>(null);
  const { run: join, loading, error } = useAction(joinSide);

  const submit = async () => {
    if (!side) return;
    if (!isBackendConfigured || !betId) {
      return navigation.replace('BetDetail', { id: betId });
    }
    const joined = await join(betId, side);
    if (joined) navigation.replace('BetDetail', { id: betId });
  };

  const Option = ({ value, label, sub, color }: { value: Exclude<Side, null>; label: string; sub: string; color: string }) => (
    <Pressable
      onPress={() => setSide(value)}
      style={[
        styles.option,
        { borderColor: side === value ? color : colors.border.default, backgroundColor: side === value ? `${color}22` : colors.bg.surface1 },
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected: side === value }}
    >
      <Text style={[styles.optLabel, { color }]}>{label}</Text>
      <Text style={styles.optSub}>{sub}</Text>
    </Pressable>
  );

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader variant="modal" title="Pick your side" onBack={() => navigation.goBack()} />
      <View style={styles.root}>
        <Text style={styles.statement}>"{title}"</Text>
        <View style={styles.options}>
          <Option value="a" label="YES" sub="You’re backing the call" color={colors.side.a} />
          <Option value="b" label="NO" sub="You’re fading it" color={colors.side.b} />
        </View>
        <View style={styles.footer}>
          <Button
            label="Lock in my side"
            onPress={submit}
            disabled={!side}
            loading={loading}
            fullWidth
          />
          {error && <Text style={styles.error}>{humanError(error)}</Text>}
          <Text style={styles.warn}>Once locked, you can’t switch — but everyone sees if you try</Text>
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.screenGutter },
  statement: {
    fontFamily: 'Barlow-Bold',
    fontSize: 20,
    lineHeight: 27,
    color: colors.text.primary,
    marginVertical: spacing[5],
  },
  // alignItems:'center' stops the cards stretching to the cross axis. With
  // flex:1 alone they grew to the full height left between the statement and
  // the footer — on a tall phone that was a ~700pt card with the label
  // stranded in the middle. The row still takes the space; the cards sit
  // centred inside it at their own height.
  options: { flexDirection: 'row', gap: spacing[3], flex: 1, alignItems: 'center' },
  option: {
    flex: 1,
    minHeight: 168,
    borderRadius: radius.lg,
    borderWidth: 2,
    padding: spacing[5],
    gap: spacing[2],
    justifyContent: 'center',
  },
  optLabel: { fontFamily: 'Barlow-Black', fontSize: 24 },
  optSub: { fontFamily: 'Inter-Regular', fontSize: 12, color: colors.text.secondary },
  footer: { gap: spacing[3], paddingBottom: spacing[6] },
  warn: { fontFamily: 'Inter-Regular', fontSize: 11, color: colors.text.tertiary, textAlign: 'center' },
  error: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.interactive.destructive,
    textAlign: 'center',
  },
});
