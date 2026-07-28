import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import {
  ScreenBackground,
  NavHeader,
  BentoTile,
  AvatarStack,
  BetCard,
  Button,
  type BetCardData,
} from '../components';

// Group detail — members, the group's Cookie Jar, and its open bets.
export function GroupScreen({ navigation, route }: any) {
  const name = route?.params?.name ?? 'Sunday League';

  const members = [{ initials: 'RS' }, { initials: 'MC' }, { initials: 'PR' }, { initials: 'DJ' }, { initials: 'AB' }];
  const bets: BetCardData[] = [
    {
      id: '1', title: 'Arsenal finish top 4', status: 'awaiting',
      author: { handle: '@marcus', initials: 'MC' }, group: name,
      sideAPercent: 62, sideACount: 5, sideBCount: 3, participantCount: 8,
      stake: '🍺', deadline: new Date(Date.now() + 1000 * 60 * 60 * 40),
    },
  ];

  return (
    <ScreenBackground tone="base">
      <NavHeader
        variant="back"
        title={name}
        onBack={() => navigation.goBack()}
        rightActions={[
          { icon: <Text style={styles.icon}>＋</Text>, onPress: () => navigation.navigate('ShareInvite'), accessibilityLabel: 'Invite' },
        ]}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.emoji}>⚽</Text>
          <AvatarStack people={members} max={5} size="md" />
          <Text style={styles.count}>{members.length} members</Text>
        </View>

        {/* Group tiles */}
        <View style={styles.row}>
          <BentoTile
            size="wide" tone="amber" emoji="🍪" value="$23.50" label="Cookie Jar →"
            onPress={() => navigation.navigate('CookieJar')}
          />
          <View style={styles.col}>
            <BentoTile size="stat" tone="navy" value="6" label="Open bets" />
            <BentoTile size="stat" tone="mint-tint" value="42" label="Settled" />
          </View>
        </View>

        <Text style={styles.q}>OPEN BETS</Text>
        {bets.map((b) => (
          <BetCard key={b.id} bet={b} onPress={() => navigation.navigate('BetDetail', { id: b.id })} />
        ))}

        <Button label="Call something new" onPress={() => navigation.navigate('CreateBet')} fullWidth style={styles.cta} />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenGutter, gap: spacing[3], paddingBottom: spacing[8] },
  icon: { fontSize: 24, color: colors.text.secondary },
  header: { alignItems: 'center', gap: spacing[2], paddingVertical: spacing[2] },
  emoji: { fontSize: 44 },
  count: { fontFamily: 'Inter-Regular', fontSize: 12, color: colors.text.tertiary },
  row: { flexDirection: 'row', gap: spacing[3] },
  col: { gap: spacing[3] },
  q: { fontFamily: 'Barlow-SemiBold', fontSize: 11, letterSpacing: 2, color: colors.semantic.awaiting, marginTop: spacing[3] },
  cta: { marginTop: spacing[3] },
});
