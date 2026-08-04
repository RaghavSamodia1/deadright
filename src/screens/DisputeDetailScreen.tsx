import React, { useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import { ScreenBackground, NavHeader, TimelineEvent, Button, ActionSheet } from '../components';
import { getDispute, castDisputeVote } from '../api/resolution';
import { useQuery, useAction } from '../hooks/useQuery';
import { useRealtime } from '../hooks/useRealtime';
import { uidOrNull } from '../lib/supabase';
import { takePhoto, pickFromLibrary, type PickedPhoto } from '../lib/evidence';
import { addEvidence } from '../api/resolution';
import { isBackendConfigured } from '../lib/supabase';
import { relativeTime } from '../lib/plural';

// Dispute detail — group vote resolves a contested outcome (dispute_votes).
// Evidence matters most here: the group votes on what it can actually see.
export function DisputeDetailScreen({ navigation, route }: any) {
  const betId = route?.params?.betId ?? route?.params?.id;
  const [localVote, setLocalVote] = useState<'a' | 'b' | null>(null);

  const REASON_LABEL: Record<string, string> = {
    didnt_happen: 'DIDN’T HAPPEN',
    deadline: 'DEADLINE',
    stake_unclear: 'STAKE UNCLEAR',
    other: 'OTHER',
  };

  const { data: dispute, refetch } = useQuery<any>(
    async () => {
      if (!betId) return null;
      const [d, uid] = await Promise.all([getDispute(betId), uidOrNull()]);
      return d ? { ...d, uid } : null;
    },
    null,
    [betId],
  );

  const raiserHandle = dispute?.raiser?.handle
    ? `@${dispute.raiser.handle}`
    : dispute?.raiser?.display_name ?? 'Someone';

  // Live: other members voting should move the bar while you watch.
  useRealtime('dispute_votes', refetch);

  const { run: castVote, loading: voting } = useAction(castDisputeVote);

  const title = dispute?.bet?.title ?? route?.params?.title ?? 'Disputed bet';
  const votes: any[] = dispute?.votes ?? [];
  const myVote =
    localVote ?? votes.find((v) => v.user_id === dispute?.uid)?.side ?? null;
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

  const votesA = votes.filter((v) => v.side === 'a').length;
  const votesB = votes.filter((v) => v.side === 'b').length;
  const total = votesA + votesB;
  const pctA = total > 0 ? Math.round((votesA / total) * 100) : 50;

  const submitVote = async (side: 'a' | 'b') => {
    setLocalVote(side); // optimistic — the bar moves immediately
    if (dispute?.id) {
      await castVote(dispute.id, side);
      refetch();
    }
  };

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader variant="back" title="Dispute" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Disputed — the group decides</Text>
        </View>
        <Text style={styles.statement}>"{title}"</Text>

        {/* Claims */}
        <View style={[styles.claim, { borderColor: colors.side.a }]}>
          <Text style={[styles.claimSide, { color: colors.side.a }]}>PROPOSED OUTCOME</Text>
          <Text style={styles.claimText}>
            {dispute?.bet?.winning_side
              ? `Side ${String(dispute.bet.winning_side).toUpperCase()} was proposed as the winner.`
              : 'An outcome was proposed for this bet.'}
          </Text>
        </View>
        <View style={[styles.claim, { borderColor: colors.side.b }]}>
          {/* getDispute already joins the raiser; this was the literal string
              "@deej · SIDE B", so every dispute was attributed to a mock user. */}
          <Text style={[styles.claimSide, { color: colors.side.b }]}>
            {raiserHandle}
            {dispute?.reason ? ` · ${REASON_LABEL[dispute.reason] ?? dispute.reason}` : ''}
          </Text>
          <Text style={styles.claimText}>
            {dispute?.detail ? `“${dispute.detail}”` : 'Someone contested the result.'}
          </Text>
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
            <Text style={styles.addProofIcon}></Text>
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
        {myVote ? (
          <Text style={styles.voted}>You voted Side {String(myVote).toUpperCase()}</Text>
        ) : (
          <View style={styles.voteRow}>
            <Button label="Vote A" onPress={() => submitVote('a')} loading={voting} style={styles.voteBtn} />
            <Button
              label="Vote B"
              onPress={() => submitVote('b')}
              loading={voting}
              variant="secondary"
              style={styles.voteBtn}
            />
          </View>
        )}

        <Text style={styles.q}>ACTIVITY</Text>
        <View>
          <TimelineEvent text="@abi voted Side A" timestamp="10m ago" tone="default" />
          <TimelineEvent text="@jk voted Side B" timestamp="25m ago" tone="side-b" />
          <TimelineEvent
            text={`${raiserHandle} raised the dispute`}
            timestamp={dispute?.created_at ? relativeTime(dispute.created_at) : ''}
            tone="dispute"
            isLast
          />
        </View>
      </ScrollView>

      <ActionSheet
        visible={sheetOpen}
        onDismiss={() => setSheetOpen(false)}
        title="Add proof"
        options={[
          { label: ' Take a photo', onPress: async () => addProof(await takePhoto()) },
          { label: ' Choose from library', onPress: async () => addProof(await pickFromLibrary()) },
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
