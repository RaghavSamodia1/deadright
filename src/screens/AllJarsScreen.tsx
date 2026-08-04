import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import { ScreenBackground, NavHeader, ListRow, EmptyState, Button } from '../components';
import { getJarsByGroup } from '../api/jar';
import { useQuery } from '../hooks/useQuery';
import { formatMoney } from '../lib/money';
import { plural } from '../lib/plural';

/**
 * Every group's Cookie Jar in one list.
 *
 * The Home tile sums all of them, so tapping it used to drop you into whichever
 * group happened to be first — which silently hid the rest of the money the
 * tile had just counted. This is the breakdown behind that number.
 */
export function AllJarsScreen({ navigation }: any) {
  const { data: jars, loading, error } = useQuery(getJarsByGroup, []);

  const total = jars.reduce((sum, j) => sum + j.totalCents, 0);

  return (
    <ScreenBackground tone="base">
      <NavHeader variant="back" title="Cookie Jars" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Couldn’t load your jars</Text>
            <Text style={styles.noticeBody}>{error.message}</Text>
          </View>
        ) : jars.length === 0 ? (
          <EmptyState
            emoji="🍪"
            title={loading ? 'Loading…' : 'No jars yet'}
            body="Jars live inside groups. Make or join one, then set the rules everyone has to keep."
          />
        ) : (
          <>
            <View style={styles.totalCard}>
              <Text style={styles.totalValue}>{formatMoney(total)}</Text>
              <Text style={styles.totalLabel}>
                ACROSS {plural(jars.length, 'JAR').toUpperCase()}
              </Text>
            </View>

            {jars.map((j) => (
              <ListRow
                key={j.groupId}
                title={`${j.emoji ?? '👥'}  ${j.name}`}
                subtitle={
                  j.violationCount === 0
                    ? 'Clean sheet'
                    : plural(j.violationCount, 'violation')
                }
                value={formatMoney(j.totalCents)}
                valueColor={j.totalCents > 0 ? colors.semantic.awaiting : colors.text.tertiary}
                showChevron
                onPress={() =>
                  navigation.navigate('CookieJar', { groupId: j.groupId, groupName: j.name })
                }
              />
            ))}

            <Text style={styles.footnote}>
              Every jar settles inside its own group — nothing pools across them.
            </Text>
          </>
        )}

        <Button
          label="New group"
          onPress={() => navigation.navigate('CreateGroup')}
          variant="secondary"
          fullWidth
          style={styles.cta}
        />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenGutter, gap: spacing[3], paddingBottom: spacing[8] },
  totalCard: {
    backgroundColor: colors.card.amber,
    borderRadius: radius.lg,
    padding: spacing[5],
    alignItems: 'center',
    gap: spacing[1],
  },
  totalValue: {
    fontFamily: 'Barlow-Black',
    fontSize: 44,
    letterSpacing: -1.5,
    // Navy on amber is 11.88:1; the off-white body colour would be 1.38:1.
    color: colors.cardInk.onLight.primary,
    includeFontPadding: false,
  },
  totalLabel: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 10,
    letterSpacing: 2,
    color: colors.cardInk.onLight.muted,
  },
  footnote: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 16,
    color: colors.text.tertiary,
    marginTop: spacing[1],
  },
  cta: { marginTop: spacing[3] },
  notice: {
    backgroundColor: colors.bg.surface1,
    borderRadius: radius.md,
    padding: spacing[4],
    gap: spacing[2],
  },
  noticeTitle: { fontFamily: 'Barlow-Bold', fontSize: 15, color: colors.text.primary },
  noticeBody: { fontFamily: 'Inter-Regular', fontSize: 13, color: colors.text.secondary },
});
