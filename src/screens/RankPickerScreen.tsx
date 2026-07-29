import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing } from '../tokens';
import { ScreenBackground, NavHeader, Button, EmptyState } from '../components';
import { getOptions, submitRanking } from '../api/ordinals';
import { useQuery, useAction } from '../hooks/useQuery';
import { isBackendConfigured } from '../lib/supabase';

type Option = { id: string; label: string };

const MOCK: Option[] = [
  { id: 'o1', label: 'Arsenal' },
  { id: 'o2', label: 'Man City' },
  { id: 'o3', label: 'Liverpool' },
  { id: 'o4', label: 'Spurs' },
];

/**
 * Ordinal bets: predict a finishing order rather than a yes/no. Scored with
 * Kendall tau (score_ordinal_bet), so being *nearly* right still counts —
 * which is the point, and why it needs its own input rather than two sides.
 *
 * Reordering is done with up/down controls rather than drag-and-drop: it's
 * precise, works with screen readers, and doesn't fight the parent ScrollView.
 */
export function RankPickerScreen({ navigation, route }: any) {
  const betId: string | undefined = route?.params?.id ?? route?.params?.betId;
  const title: string = route?.params?.title ?? 'Rank them';

  const { data: options } = useQuery<Option[]>(
    async () => (betId ? ((await getOptions(betId)) as any as Option[]) : MOCK),
    MOCK,
    [betId],
  );

  const [order, setOrder] = useState<Option[]>([]);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (seeded || options.length === 0) return;
    setOrder(options);
    setSeeded(true);
  }, [options, seeded]);

  const { run: submit, loading, error } = useAction(submitRanking);

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOrder((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const lockIn = async () => {
    if (!isBackendConfigured || !betId) return navigation.goBack();
    const done = await submit(betId, order.map((o) => o.id));
    if (done !== null) navigation.replace('BetDetail', { id: betId });
  };

  if (order.length === 0) {
    return (
      <ScreenBackground tone="base">
        <NavHeader variant="back" title="Rank" onBack={() => navigation.goBack()} />
        <EmptyState
          emoji="🪜"
          title="Nothing to rank"
          body="This bet has no options yet — the creator adds them before anyone can predict an order."
        />
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground tone="base">
      <NavHeader variant="back" title="Your ranking" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.question}>{title}</Text>
        <Text style={styles.hint}>
          Order them best to worst. Close counts — you score on how near you land,
          not just exact hits.
        </Text>

        {order.map((opt, i) => (
          <View key={opt.id} style={styles.row}>
            <View style={[styles.rankBadge, i === 0 && styles.rankBadgeTop]}>
              <Text style={[styles.rankNum, i === 0 && styles.rankNumTop]}>{i + 1}</Text>
            </View>
            <Text style={styles.label} numberOfLines={1}>{opt.label}</Text>
            <Pressable
              onPress={() => move(i, -1)}
              disabled={i === 0}
              style={[styles.arrow, i === 0 && styles.arrowDisabled]}
              accessibilityRole="button"
              accessibilityLabel={`Move ${opt.label} up`}
            >
              <Text style={styles.arrowText}>▲</Text>
            </Pressable>
            <Pressable
              onPress={() => move(i, 1)}
              disabled={i === order.length - 1}
              style={[styles.arrow, i === order.length - 1 && styles.arrowDisabled]}
              accessibilityRole="button"
              accessibilityLabel={`Move ${opt.label} down`}
            >
              <Text style={styles.arrowText}>▼</Text>
            </Pressable>
          </View>
        ))}

        {error && <Text style={styles.error}>{error.message}</Text>}

        <Button label="Lock in my order" onPress={lockIn} loading={loading} fullWidth style={styles.cta} />
        <Text style={styles.footnote}>
          You can change this until the deadline. Everyone's order is hidden until then.
        </Text>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenGutter, gap: spacing[2], paddingBottom: spacing[8] },
  question: {
    fontFamily: 'Barlow-Black',
    fontSize: 22,
    lineHeight: 28,
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  hint: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 19,
    color: colors.text.secondary,
    marginBottom: spacing[3],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.bg.surface1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bg.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeTop: { backgroundColor: colors.semantic.awaiting },
  rankNum: { fontFamily: 'Barlow-Bold', fontSize: 13, color: colors.text.secondary },
  rankNumTop: { color: colors.text.inverse },
  label: { flex: 1, fontFamily: 'Barlow-SemiBold', fontSize: 15, color: colors.text.primary },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: radius.xs,
    backgroundColor: colors.bg.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: { opacity: 0.3 },
  arrowText: { fontSize: 11, color: colors.text.secondary },
  error: { fontFamily: 'Inter-Regular', fontSize: 13, color: colors.interactive.destructive },
  cta: { marginTop: spacing[4] },
  footnote: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 16,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
