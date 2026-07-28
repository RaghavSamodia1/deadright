import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import { ScreenBackground, NavHeader, CredRing, StatsRow, Button, type Stat } from '../components';

// Friend profile — their Cred + your head-to-head record.
export function FriendProfileScreen({ navigation, route }: any) {
  const handle = route?.params?.handle ?? '@marcus';

  const stats: Stat[] = [
    { value: '812', label: 'Cred', highlight: true },
    { value: '64%', label: 'Win rate' },
    { value: '3', label: 'Groups' },
  ];

  // Head-to-head vs you
  const h2h = { wins: 7, losses: 4 };
  const total = h2h.wins + h2h.losses;

  return (
    <ScreenBackground tone="base">
      <NavHeader
        variant="back"
        title={handle}
        onBack={() => navigation.goBack()}
        rightActions={[
          { icon: <Text style={styles.icon}>⋯</Text>, onPress: () => navigation.navigate('BlockedUsers'), accessibilityLabel: 'More' },
        ]}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <CredRing percent={78} score={812} size={132} strokeWidth={9} />
          <Text style={styles.name}>Marcus C</Text>
          <Text style={styles.sub}>{handle} · Sharp caller</Text>
        </View>

        <StatsRow stats={stats} style={styles.statsRow} />

        {/* Head-to-head */}
        <Text style={styles.q}>YOU VS {handle.toUpperCase()}</Text>
        <View style={styles.h2h}>
          <View style={[styles.h2hBar, { flex: h2h.wins, backgroundColor: colors.semantic.win }]} />
          <View style={[styles.h2hBar, { flex: h2h.losses, backgroundColor: colors.semantic.loss }]} />
        </View>
        <View style={styles.h2hLabels}>
          <Text style={[styles.h2hNum, { color: colors.semantic.win }]}>You {h2h.wins}</Text>
          <Text style={styles.h2hTotal}>{total} settled</Text>
          <Text style={[styles.h2hNum, { color: colors.semantic.loss }]}>{h2h.losses} them</Text>
        </View>

        <Button label="Call them out 🔥" onPress={() => navigation.navigate('CreateBet')} fullWidth style={styles.cta} />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenGutter, gap: spacing[4], paddingBottom: spacing[8] },
  icon: { fontSize: 22, color: colors.text.secondary },
  hero: { alignItems: 'center', gap: spacing[2], paddingVertical: spacing[3] },
  name: { fontFamily: 'Barlow-Bold', fontSize: 20, color: colors.text.primary },
  sub: { fontFamily: 'Inter-Regular', fontSize: 12, color: colors.text.tertiary },
  statsRow: {
    backgroundColor: colors.bg.surface1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing[4],
  },
  q: { fontFamily: 'Barlow-SemiBold', fontSize: 11, letterSpacing: 2, color: colors.semantic.awaiting },
  h2h: { flexDirection: 'row', height: 14, borderRadius: 999, overflow: 'hidden', gap: 2 },
  h2hBar: { borderRadius: 999 },
  h2hLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  h2hNum: { fontFamily: 'Barlow-SemiBold', fontSize: 12 },
  h2hTotal: { fontFamily: 'Inter-Regular', fontSize: 11, color: colors.text.tertiary },
  cta: { marginTop: spacing[3] },
});
