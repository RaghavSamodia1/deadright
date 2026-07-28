import React, { useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import { ScreenBackground, NavHeader, TimelineEvent, Button, ActionSheet } from '../components';
import { takePhoto, pickFromLibrary, type PickedPhoto } from '../lib/evidence';
import { addEvidence } from '../api/resolution';
import { isBackendConfigured } from '../lib/supabase';

// Dispute detail — group vote resolves a contested outcome (dispute_votes).
// Evidence matters most here: the group votes on what it can actually see.
export function DisputeDetailScreen({ navigation, route }: any) {
  const title = route?.params?.title ?? 'It snows in London before December';
  const betId = route?.params?.betId ?? route?.params?.id;
  const [vote, setVote] = useState<'a' | 'b' | null>(null);
  const [proof, setProof] = useState<string[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  const addProof = async (photo: PickedPhoto | null) => {
    if (!photo) return;
    setProof((p) => [...p, photo.uri]);
    if (isBackendConfigured && betId) {
      try {
        await addEvidence(betId, 'dispute evidence', photo.uri);
      } catch {
        // Keep the local thumbnail; the upload can be retried on submit.
      }
    }
  };

  // TODO: wire to src/api — getDispute(), castDisputeVote()
  const votesA = 4 + (vote === 'a' ? 1 : 0);
  const votesB = 3 + (vote === 'b' ? 1 : 0);
  const total = votesA + votesB;
  const pctA = Math.round((votesA / total) * 100);

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader variant="back" title="Dispute" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>⚖️ Disputed — the group decides</Text>
        </View>
        <Text style={styles.statement}>"{title}"</Text>

        {/* Claims */}
        <View style={[styles.claim, { borderColor: colors.side.a }]}>
          <Text style={[styles.claimSide, { color: colors.side.a }]}>@marcus · SIDE A</Text>
          <Text style={styles.claimText}>“It snowed on the 28th — I’ve got the Met Office screenshot.”</Text>
        </View>
        <View style={[styles.claim, { borderColor: colors.side.b }]}>
          <Text style={[styles.claimSide, { color: colors.side.b }]}>@deej · SIDE B</Text>
          <Text style={styles.claimText}>“That was sleet, not snow. Doesn’t count.”</Text>
        </View>

        {/* Evidence — the group votes on what it can see */}
        <Text style={styles.q}>EVIDENCE</Text>
        <View style={styles.proofRow}>
          {proof.map((uri, i) => (
            <Pressable
              key={i}
              onLongPress={() => setProof((p) => p.filter((_, idx) => idx !== i))}
              accessibilityLabel="Evidence photo, long press to remove"
            >
              <Image source={{ uri }} style={styles.proofThumb} />
            </Pressable>
          ))}
          <Pressable
            onPress={() => setSheetOpen(true)}
            style={styles.addProof}
            accessibilityRole="button"
            accessibilityLabel="Add photo evidence"
          >
            <Text style={styles.addProofIcon}>📷</Text>
            <Text style={styles.addProofLabel}>Add proof</Text>
          </Pressable>
        </View>

        {/* Tally */}
        <Text style={styles.q}>GROUP VOTE · {total} cast</Text>
        <View style={styles.tallyTrack}>
          <View style={[styles.tallyA, { flex: pctA }]} />
          <View style={[styles.tallyB, { flex: 100 - pctA }]} />
        </View>
        <View style={styles.tallyLabels}>
          <Text style={[styles.tallyNum, { color: colors.side.a }]}>Side A · {votesA}</Text>
          <Text style={[styles.tallyNum, { color: colors.side.b }]}>{votesB} · Side B</Text>
        </View>

        {/* Vote buttons */}
        {vote ? (
          <Text style={styles.voted}>You voted Side {vote.toUpperCase()} ✓</Text>
        ) : (
          <View style={styles.voteRow}>
            <Button label="Vote A" onPress={() => setVote('a')} style={styles.voteBtn} />
            <Button label="Vote B" onPress={() => setVote('b')} variant="secondary" style={styles.voteBtn} />
          </View>
        )}

        <Text style={styles.q}>ACTIVITY</Text>
        <View>
          <TimelineEvent text="@abi voted Side A" timestamp="10m ago" tone="side-a" />
          <TimelineEvent text="@jk voted Side B" timestamp="25m ago" tone="side-b" />
          <TimelineEvent text="@deej raised the dispute" timestamp="1h ago" tone="dispute" isLast />
        </View>
      </ScrollView>

      <ActionSheet
        visible={sheetOpen}
        onDismiss={() => setSheetOpen(false)}
        title="Add proof"
        options={[
          { label: '📷  Take a photo', onPress: async () => addProof(await takePhoto()) },
          { label: '🖼  Choose from library', onPress: async () => addProof(await pickFromLibrary()) },
        ]}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenGutter, gap: spacing[4], paddingBottom: spacing[8] },
  banner: {
    backgroundColor: colors.semantic.disputedDim,
    borderRadius: radius.sm,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    alignSelf: 'flex-start',
  },
  bannerText: { fontFamily: 'Barlow-SemiBold', fontSize: 12, color: colors.semantic.disputed },
  statement: {
    fontFamily: 'Barlow-Bold',
    fontSize: 20,
    lineHeight: 27,
    color: colors.text.primary,
  },
  claim: {
    borderLeftWidth: 3,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.surface1,
    padding: spacing[3],
    gap: 4,
  },
  claimSide: { fontFamily: 'Barlow-SemiBold', fontSize: 10, letterSpacing: 1 },
  claimText: { fontFamily: 'Inter-Regular', fontSize: 14, lineHeight: 20, color: colors.text.primary },
  q: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    color: colors.semantic.awaiting,
    marginTop: spacing[2],
  },
  tallyTrack: {
    flexDirection: 'row',
    height: 14,
    borderRadius: 999,
    overflow: 'hidden',
    gap: 2,
  },
  tallyA: { backgroundColor: colors.side.a, borderRadius: 999 },
  tallyB: { backgroundColor: colors.side.b, borderRadius: 999 },
  tallyLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  tallyNum: { fontFamily: 'Barlow-SemiBold', fontSize: 12 },
  proofRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], alignItems: 'center' },
  proofThumb: {
    width: 76,
    height: 76,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  addProof: {
    width: 76,
    height: 76,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.semantic.awaiting,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addProofIcon: { fontSize: 20 },
  addProofLabel: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 9,
    color: colors.semantic.awaiting,
  },
  voteRow: { flexDirection: 'row', gap: spacing[3] },
  voteBtn: { flex: 1 },
  voted: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 14,
    color: colors.semantic.win,
    textAlign: 'center',
    paddingVertical: spacing[2],
  },
});
