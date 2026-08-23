import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import { ScreenBackground, NavHeader, FormRing, StatsRow, Button, ActionSheet, type Stat } from '../components';
import { searchProfiles } from '../api/profile';
import { blockUser } from '../api/settings';
import { useQuery, useAction } from '../hooks/useQuery';

// Friend profile — their Form + your head-to-head record.
export function FriendProfileScreen({ navigation, route }: any) {
  const handle = route?.params?.handle ?? 'Marcus';
  const [sheetOpen, setSheetOpen] = React.useState(false);

  // Look the person up by handle so we can act on them (block, head-to-head).
  const { data: person } = useQuery<any>(
    async () => {
      const clean = String(handle).replace('@', '');
      const results = await searchProfiles(clean);
      return results.find((p: any) => p.handle === clean) ?? null;
    },
    null,
    [handle],
  );

  const { run: block, loading: blocking } = useAction(blockUser);

  // A withheld Form is not a Form of 500. `private_profile` makes the search
  // function return null rather than the number (00034), so the ring shows
  // nothing and says why — the previous `?? 500` drew a full ring on an
  // invented score, which is the most convincing way to be wrong.
  const form: number | null = person?.form_score ?? null;
  const hidden: boolean = person?.is_private === true;

  // These were hardcoded to 812 / 64% / 3 and a 7-4 head-to-head, so every
  // profile showed the same invented record about a real person — the one kind
  // of wrong that looks completely convincing. Form is real; the rest needs
  // per-person aggregates the API does not expose yet, so it says so instead of
  // making a number up.
  const stats: Stat[] = [
    { value: form != null ? String(form) : '—', label: 'Form', highlight: true },
    { value: '—', label: 'Win rate' },
    { value: '—', label: 'Groups' },
  ];

  return (
    <ScreenBackground tone="base">
      <NavHeader
        variant="back"
        title={handle}
        onBack={() => navigation.goBack()}
        rightActions={[
          {
            icon: <Text style={styles.icon}>⋯</Text>,
            onPress: () => setSheetOpen(true),
            accessibilityLabel: 'More options',
          },
        ]}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {/* The ring, the name and the tagline were all hardcoded: every profile
            opened as "Marcus C" on 812 with a 78% ring, whoever you tapped. */}
        <View style={styles.hero}>
          <FormRing
            percent={form != null ? Math.max(0, Math.min(100, Math.round(((form - 250) / 500) * 100))) : 0}
            score={form ?? undefined}
            size={132}
            strokeWidth={9}
          />
          <Text style={styles.name}>
            {person?.display_name ?? person?.handle ?? handle}
          </Text>
          <Text style={styles.sub}>{person?.handle ?? handle}</Text>
          {hidden && (
            <Text style={styles.private}>
              Private profile — their Form isn&rsquo;t shown outside their groups.
            </Text>
          )}
        </View>

        <StatsRow stats={stats} />

        <Button label="Call them out" onPress={() => navigation.navigate('CreateBet')} fullWidth style={styles.cta} />
      </ScrollView>

      <ActionSheet
        visible={sheetOpen}
        onDismiss={() => setSheetOpen(false)}
        title={handle}
        options={[
          {
            label: ` Block ${handle}`,
            destructive: true,
            onPress: async () => {
              if (!person?.id) return;
              await block(person.id);
              navigation.goBack();
            },
          },
        ]}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenGutter, gap: spacing[4], paddingBottom: spacing[8] },
  icon: { fontSize: 22, color: colors.text.secondary },
  hero: { alignItems: 'center', gap: spacing[2], paddingVertical: spacing[3] },
  name: { fontFamily: 'Barlow-Bold', fontSize: 20, color: colors.text.primary },
  sub: { fontFamily: 'Inter-Regular', fontSize: 12, color: colors.text.tertiary },
  private: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 260,
    marginTop: 2,
  },
  q: { fontFamily: 'Barlow-SemiBold', fontSize: 11, letterSpacing: 2, color: colors.semantic.awaiting },
  h2h: { flexDirection: 'row', height: 14, borderRadius: 999, overflow: 'hidden', gap: 2 },
  h2hBar: { borderRadius: 999 },
  h2hLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  h2hNum: { fontFamily: 'Barlow-SemiBold', fontSize: 12 },
  h2hTotal: { fontFamily: 'Inter-Regular', fontSize: 11, color: colors.text.tertiary },
  cta: { marginTop: spacing[3] },
});
