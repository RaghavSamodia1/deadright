import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing } from '../tokens';
import {
  ScreenBackground,
  NavHeader,
  BetCard,
  StatsRow,
  TimelineEvent,
  Button,
  BottomSheet,
  ChoiceChipGroup,
  TextInput,
  type BetCardData,
  type Stat,
  type TimelineTone,
} from '../components';
import { getBet } from '../api/bets';
import { agreeOutcome, raiseDispute } from '../api/resolution';
import type { DisputeReason } from '../types/database';
import { useQuery, useAction } from '../hooks/useQuery';
import { useRealtime } from '../hooks/useRealtime';
import { uidOrNull } from '../lib/supabase';
import { toBetCard } from '../lib/mappers';

// V2-04 Bet Detail (design-v2.md §5) — BetCard + stat strip + timeline + action.
export function BetDetailScreen({ navigation, route }: any) {
  const betId: string | undefined = route?.params?.id;

  const MOCK: BetCardData = {
    id: 'mock',
    title: 'Arsenal win the league this season',
    status: 'awaiting',
    author: { handle: '@marcus', initials: 'MC' },
    group: 'Sunday League',
    sideAPercent: 62,
    sideACount: 5,
    sideBCount: 3,
    participantCount: 8,
    stake: '£10',
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 26),
  };

  // Bundle the viewer's id with the bet so win/loss and "your side" resolve.
  const { data: raw, loading, error, refetch } = useQuery<any>(
    async () => {
      if (!betId) return null;
      const [bet, uid] = await Promise.all([getBet(betId), uidOrNull()]);
      return { ...bet, uid };
    },
    null,
    [betId],
  );

  // Sides and timeline move while you're looking at the screen.
  useRealtime('bet_participants', refetch, { filter: betId ? `bet_id=eq.${betId}` : undefined });
  useRealtime('bet_events', refetch, { filter: betId ? `bet_id=eq.${betId}` : undefined });
  useFocusEffect(
    useCallback(() => {
      refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [betId]),
  );

  const bet: BetCardData = raw ? toBetCard(raw, raw.uid) : MOCK;
  const events: any[] = raw?.events ?? [];
  const myEntry = (raw?.participants ?? []).find((p: any) => p.user_id === raw?.uid);
  const canJoin = raw ? raw.status === 'active' || raw.status === 'live' : true;
  const canResolve = raw ? raw.status === 'awaiting' : false;
  const isOrdinal = raw?.type === 'ordinal';
  // pending_agreement: someone proposed an outcome and the other side must
  // agree or dispute. Only participants who haven't agreed get the choice.
  const awaitingMyCall = !!raw && raw.status === 'pending_agreement' && !!myEntry && !myEntry.agreed;

  const { run: agree, loading: agreeing } = useAction(agreeOutcome);
  const { run: dispute, loading: disputing, error: disputeError } = useAction(raiseDispute);
  const [disputeOpen, setDisputeOpen] = React.useState(false);
  const [reason, setReason] = React.useState<DisputeReason>('didnt_happen');
  const [detail, setDetail] = React.useState('');

  const hoursLeft = Math.round((bet.deadline.getTime() - Date.now()) / 3600_000);
  const stakeCents = raw?.stake_amount_cents ?? 0;
  const stats: Stat[] = [
    { value: hoursLeft > 0 ? `${hoursLeft}h` : 'Passed', label: 'Deadline' },
    { value: bet.stake ?? '—', label: 'Stake' },
    {
      value: stakeCents
        ? `£${((stakeCents * Math.max(bet.participantCount, 1)) / 100).toFixed(0)}`
        : '—',
      label: 'Pot',
    },
  ];

  const timeline = events.length
    ? events
        .slice()
        .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
        .map((e) => ({
          text: describeEvent(e),
          timestamp: relativeTime(e.created_at),
          tone: eventTone(e.kind),
        }))
    : [{ text: 'Called it — the clock is running', timestamp: relativeTime(raw?.created_at ?? new Date().toISOString()), tone: 'side-a' as const }];

  return (
    <ScreenBackground tone="base">
      <NavHeader
        variant="back"
        title="Bet"
        onBack={() => navigation.goBack()}
        rightActions={[
          {
            icon: <Text style={styles.icon}>↗</Text>,
            onPress: () => navigation.navigate('ShareInvite', { id: bet.id }),
            accessibilityLabel: 'Share bet',
          },
        ]}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BetCard bet={bet} onPress={() => {}} />

        <StatsRow stats={stats} style={styles.statsRow} />

        <Text style={styles.section}>TIMELINE</Text>
        <View style={styles.timeline}>
          {timeline.map((e, i) => (
            <TimelineEvent
              key={i}
              text={e.text}
              timestamp={e.timestamp}
              tone={e.tone}
              isLast={i === timeline.length - 1}
            />
          ))}
        </View>

        {error && <Text style={styles.error}>Couldn’t load this bet: {error.message}</Text>}

        {/* An outcome has been proposed — the other side either agrees or
            contests it. Without this the state machine dead-ends. */}
        {awaitingMyCall ? (
          <View style={styles.decision}>
            <Text style={styles.decisionTitle}>
              An outcome was proposed. Do you agree?
            </Text>
            <Button
              label="Agree — settle it"
              onPress={async () => {
                await agree(bet.id);
                refetch();
              }}
              loading={agreeing}
              fullWidth
            />
            <Button
              label="Dispute it ⚖️"
              onPress={() => setDisputeOpen(true)}
              variant="destructive"
              fullWidth
            />
          </View>
        ) : canResolve ? (
          <Button
            label="Resolve it"
            onPress={() => navigation.navigate('Resolution', { id: bet.id, title: bet.title })}
            fullWidth
            style={styles.cta}
          />
        ) : canJoin && isOrdinal ? (
          // Ordinal bets are a predicted order, not a side — Kendall tau scores
          // how close you land, so they need the ranker, not the A/B picker.
          <Button
            label={myEntry ? 'Change my ranking' : 'Rank them'}
            onPress={() => navigation.navigate('RankPicker', { id: bet.id, title: bet.title })}
            fullWidth
            style={styles.cta}
          />
        ) : canJoin ? (
          <Button
            label={myEntry ? `You're on Side ${String(myEntry.side).toUpperCase()}` : 'Pick your side'}
            onPress={() =>
              navigation.navigate('SideSelection', { id: bet.id, title: bet.title })
            }
            disabled={!!myEntry}
            fullWidth
            style={styles.cta}
          />
        ) : null}
      </ScrollView>

      <BottomSheet visible={disputeOpen} onDismiss={() => setDisputeOpen(false)}>
        <Text style={styles.section}>RAISE A DISPUTE</Text>
        <Text style={styles.disputeBlurb}>
          This goes to a group vote. Say what you think actually happened.
        </Text>
        <ChoiceChipGroup
          options={[
            { value: 'didnt_happen' as DisputeReason, label: "Didn't happen" },
            { value: 'deadline_issue' as DisputeReason, label: 'Deadline' },
            { value: 'stake_unclear' as DisputeReason, label: 'Stake unclear' },
            { value: 'other' as DisputeReason, label: 'Other' },
          ]}
          value={reason}
          onChange={setReason}
        />
        <TextInput
          label="What happened?"
          placeholder="That was sleet, not snow…"
          value={detail}
          onChangeText={setDetail}
          multiline
          maxChars={140}
          error={disputeError ? disputeError.message : undefined}
        />
        <Button
          label="Send to the group"
          onPress={async () => {
            const raised = await dispute(bet.id, reason, detail || undefined);
            if (raised) {
              setDisputeOpen(false);
              refetch();
              navigation.navigate('DisputeDetail', { betId: bet.id, title: bet.title });
            }
          }}
          loading={disputing}
          variant="destructive"
          fullWidth
          style={styles.cta}
        />
      </BottomSheet>
    </ScreenBackground>
  );
}

// bet_events row → a human line in the timeline.
function describeEvent(e: any): string {
  const who = e.payload?.handle ? `@${e.payload.handle}` : 'Someone';
  switch (e.kind) {
    case 'created': return `${who} called it`;
    case 'joined': return `${who} joined Side ${String(e.payload?.side ?? '').toUpperCase()}`;
    case 'side_switched': return `${who} switched sides 👀`;
    case 'went_live': return 'It kicked off — live now';
    case 'deadline_passed': return 'Deadline passed — needs resolving';
    case 'outcome_proposed': return `${who} proposed the outcome`;
    case 'agreed': return `${who} agreed`;
    case 'dispute_raised': return `${who} disputed it`;
    case 'escalated': return 'Escalated to a group vote';
    case 'evidence_added': return `${who} added evidence`;
    case 'resolved': return 'Settled';
    case 'undone': return 'Resolution undone';
    case 'cancelled': return 'Cancelled';
    default: return e.kind;
  }
}

function eventTone(kind: string): TimelineTone {
  if (kind === 'dispute_raised' || kind === 'escalated') return 'dispute';
  if (kind === 'resolved') return 'win';
  if (kind === 'deadline_passed' || kind === 'outcome_proposed') return 'awaiting';
  if (kind === 'joined' || kind === 'created') return 'side-a';
  return 'default';
}

function relativeTime(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  return hrs < 24 ? `${hrs}h ago` : `${Math.round(hrs / 24)}d ago`;
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.screenGutter,
    gap: spacing[4],
    paddingBottom: spacing[8],
  },
  icon: { fontSize: 20, color: colors.text.secondary },
  statsRow: {
    backgroundColor: colors.bg.surface1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing[4],
  },
  section: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    color: colors.semantic.awaiting,
  },
  timeline: { gap: 0 },
  error: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.interactive.destructive,
  },
  cta: { marginTop: spacing[2] },
  decision: {
    gap: spacing[2],
    backgroundColor: colors.semantic.awaitingDim,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.semantic.awaiting,
    padding: spacing[4],
    marginTop: spacing[2],
  },
  decisionTitle: {
    fontFamily: 'Barlow-Bold',
    fontSize: 15,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  disputeBlurb: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 19,
    color: colors.text.secondary,
    marginBottom: spacing[3],
  },
});
