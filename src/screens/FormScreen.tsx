import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import { ScreenBackground, NavHeader, FormRing, ListRow, EmptyState } from '../components';
import { getMyProfile, getFormHistory } from '../api/profile';
import { useQuery } from '../hooks/useQuery';

/**
 * Form is the point of the app — the reputation you build by being right and
 * settling honestly. This shows the score, how it moved, and why.
 *
 * Weighting mirrors recompute_form (00003_functions.sql): accuracy 40,
 * settlement 20, participation 25, honesty 15, over a 500-point spread.
 */
const WEIGHTS = [
  { label: 'Accuracy', pct: 40, note: 'Calls you got right' },
  { label: 'Participation', pct: 25, note: 'Bets you actually take' },
  { label: 'Settlement', pct: 20, note: 'Agreeing outcomes promptly' },
  { label: 'Honesty', pct: 15, note: 'Owning up, not stalling disputes' },
];

export function FormScreen({ navigation }: any) {
  const { data: profile } = useQuery(getMyProfile, {
    handle: 'you',
    form_score: 500,
    current_streak: 0,
    best_streak: 0,
  } as any);

  const { data: history } = useQuery(() => getFormHistory(30), [] as any[]);

  const form = profile.form_score ?? 500;
  const percentile = Math.max(0, Math.min(100, Math.round(((form - 250) / 500) * 100)));

  // Net movement over the window, and a sparkline of the running score.
  const net = history.reduce((sum: number, e: any) => sum + (e.delta ?? 0), 0);
  const series = buildSeries(history, form);
  const min = Math.min(...series, form);
  const max = Math.max(...series, form);
  const span = Math.max(max - min, 1);

  return (
    <ScreenBackground tone="base">
      <NavHeader variant="back" title="Form Score" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <FormRing percent={percentile} score={form} size={168} strokeWidth={12} />
          <Text style={styles.percentile}>Top {Math.max(1, 100 - percentile)}% of callers</Text>
          <Text style={[styles.net, { color: net >= 0 ? colors.semantic.win : colors.semantic.disputed }]}>
            {net >= 0 ? '+' : ''}{net} in the last 30 days
          </Text>
        </View>

        {/* Sparkline — enough to see the shape without pretending to be a chart */}
        {series.length > 1 && (
          <View style={styles.chartCard}>
            <View style={styles.chart}>
              {series.map((v, i) => (
                <View
                  key={i}
                  style={[
                    styles.bar,
                    {
                      height: `${20 + ((v - min) / span) * 80}%`,
                      backgroundColor:
                        i === series.length - 1 ? colors.semantic.awaiting : colors.border.strong,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.chartLabel}>LAST 30 DAYS</Text>
          </View>
        )}

        <Text style={styles.section}>WHAT MOVES IT</Text>
        {WEIGHTS.map((w) => (
          <View key={w.label} style={styles.weightRow}>
            <View style={styles.weightTop}>
              <Text style={styles.weightLabel}>{w.label}</Text>
              <Text style={styles.weightPct}>{w.pct}%</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${w.pct}%` }]} />
            </View>
            <Text style={styles.weightNote}>{w.note}</Text>
          </View>
        ))}

        <Text style={styles.section}>RECENT CHANGES</Text>
        {history.length === 0 ? (
          <EmptyState
            icon="chart"
            title="Nothing yet"
            body="Settle a few bets and your Form history shows up here."
          />
        ) : (
          history
            .slice()
            .reverse()
            .map((e: any, i: number) => (
              <ListRow
                key={i}
                title={reasonLabel(e.reason)}
                subtitle={when(e.created_at)}
                value={`${e.delta >= 0 ? '+' : ''}${e.delta}`}
                valueColor={e.delta >= 0 ? colors.semantic.win : colors.semantic.disputed}
                showChevron={false}
              />
            ))
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

// Walk the deltas backwards from the current score to get the running value.
function buildSeries(history: any[], current: number): number[] {
  if (!history.length) return [];
  const out: number[] = [current];
  for (let i = history.length - 1; i >= 0; i--) {
    out.unshift(out[0] - (history[i].delta ?? 0));
  }
  return out.slice(-24); // cap the bar count so it stays readable
}

function reasonLabel(reason: string): string {
  const map: Record<string, string> = {
    bet_won: 'Won the bet',
    bet_lost: 'Lost the bet',
    settled_fast: 'Settled promptly',
    settled_slow: 'Slow to settle',
    disputed_lost: 'Lost a dispute',
    owned_up: 'Owned up',
    participation: 'Took a bet',
    recompute: 'Score recalculated',
  };
  return map[reason] ?? reason?.replace(/_/g, ' ') ?? 'Change';
}

function when(iso: string): string {
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return 'Today';
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenGutter, gap: spacing[3], paddingBottom: spacing[8] },
  hero: { alignItems: 'center', gap: spacing[2], paddingVertical: spacing[4] },
  percentile: { fontFamily: 'Barlow-Bold', fontSize: 16, color: colors.text.primary },
  net: { fontFamily: 'Inter-Medium', fontSize: 13 },
  chartCard: {
    backgroundColor: colors.bg.surface1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing[4],
    gap: spacing[2],
  },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 64 },
  bar: { flex: 1, borderRadius: 3, minHeight: 4 },
  chartLabel: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 9,
    letterSpacing: 1,
    color: colors.text.tertiary,
  },
  section: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    color: colors.semantic.awaiting,
    marginTop: spacing[4],
  },
  weightRow: { gap: 4, marginBottom: spacing[2] },
  weightTop: { flexDirection: 'row', justifyContent: 'space-between' },
  weightLabel: { fontFamily: 'Barlow-SemiBold', fontSize: 14, color: colors.text.primary },
  weightPct: { fontFamily: 'Barlow-Bold', fontSize: 13, color: colors.semantic.awaiting },
  track: { height: 6, borderRadius: 999, backgroundColor: colors.bg.surface2, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 999, backgroundColor: colors.semantic.awaiting },
  weightNote: { fontFamily: 'Inter-Regular', fontSize: 11, color: colors.text.tertiary },
});
