import React from 'react';
import { View, Text, ScrollView, Share, Pressable, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing } from '../tokens';
import { ScreenBackground, NavHeader, Button, ListRow } from '../components';
import { getPool, getPoolResults, poolShareUrl, setPoolStatus, settlePool } from '../api/pools';
import { useQuery, useAction } from '../hooks/useQuery';
import { isBackendConfigured } from '../lib/supabase';
import { Icon } from '../components';

const DEMO = {
  id: 'demo',
  title: 'Diwali party 2026',
  question: 'Who’s getting engaged first?',
  status: 'open',
  share_token: 'demo-token',
  options: [
    { id: 'o1', label: 'Priya & Dev', sort: 0 },
    { id: 'o2', label: 'Marcus & Abi', sort: 1 },
  ],
  entries: [],
};

/**
 * Host view of a pool: the QR everyone scans, the link to paste in the group
 * chat, and a live tally. Guests never see this screen — they get the web page
 * served by the `pool` edge function.
 */
export function PoolDetailScreen({ navigation, route }: any) {
  const poolId: string | undefined = route?.params?.id;

  const { data: pool, refetch } = useQuery(
    async () => (poolId ? await getPool(poolId) : DEMO),
    DEMO as any,
    [poolId],
  );
  const { data: results } = useQuery(
    async () => (poolId ? await getPoolResults(poolId) : []),
    [] as any[],
    [poolId],
  );
  const { run: settle, loading: settling } = useAction(settlePool);
  const { run: changeStatus, loading: changing } = useAction(setPoolStatus);

  const url = isBackendConfigured && pool.share_token ? poolShareUrl(pool.share_token) : 'https://deadright.co/p/demo';
  const entryCount = pool.entries?.length ?? 0;
  const isOpen = pool.status === 'open';

  const copy = async () => {
    await Clipboard.setStringAsync(url);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const share = () =>
    Share.share({
      message: `${pool.question}\n\nPick yours — no app needed:\n${url}`,
    });

  return (
    <ScreenBackground tone="base">
      <NavHeader
        variant="back"
        title="Party Pool"
        onBack={() => navigation.goBack()}
        rightActions={[
          {
            icon: <Icon name="external" size={19} color={colors.text.secondary} strokeWidth={1.9} />,
            onPress: share,
            accessibilityLabel: 'Share pool',
          },
        ]}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.question}>{pool.question}</Text>
        <Text style={styles.meta}>
          {pool.title} · {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
          {isOpen ? '' : ' · closed'}
        </Text>

        {/* The QR is the point: hold up your phone, everyone scans it */}
        <View style={styles.qrCard}>
          <View style={styles.qrBox}>
            <QRCode value={url} size={180} backgroundColor="#FFFFFF" color="#0A0A0B" />
          </View>
          <Text style={styles.qrHint}>Scan to join — no app, no signup</Text>
        </View>

        <Pressable onPress={copy} style={styles.linkRow} accessibilityLabel="Copy link">
          <Text style={styles.link} numberOfLines={1}>{url}</Text>
          <Text style={styles.copy}>COPY</Text>
        </Pressable>

        <Button label="Share the link" onPress={share} fullWidth />

        <Text style={styles.section}>LIVE RESULTS</Text>
        {results.length === 0 || entryCount === 0 ? (
          <Text style={styles.empty}>No picks yet. Get that QR in front of people.</Text>
        ) : (
          results.map((r: any) => (
            <View key={r.option_id} style={styles.resultRow}>
              <View style={styles.resultTop}>
                <Text style={styles.resultLabel}>{r.label}</Text>
                <Text style={styles.resultCount}>
                  {r.entries} · {r.pct}%
                </Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.max(Number(r.pct), 2)}%` }]} />
              </View>
            </View>
          ))
        )}

        {poolId && !isOpen && !pool.winning_option && (
          <>
            <Text style={styles.section}>CALL THE WINNER</Text>
            <Text style={styles.empty}>
              Pick what actually happened. Everyone with the link sees it.
            </Text>
            {(pool.options ?? []).map((o: any) => (
              <ListRow
                key={o.id}
                title={o.label}
                subtitle={`${results.find((r: any) => r.option_id === o.id)?.entries ?? 0} picked this`}
                showChevron
                onPress={async () => {
                  await settle(poolId, o.id);
                  refetch();
                }}
              />
            ))}
          </>
        )}

        {poolId && (
          <Button
            label={isOpen ? 'Close the pool' : 'Reopen the pool'}
            onPress={async () => {
              await changeStatus(poolId, isOpen ? 'locked' : 'open');
              refetch();
            }}
            loading={changing}
            variant="secondary"
            fullWidth
            style={styles.closeBtn}
          />
        )}

        <Text style={styles.section}>WHO’S IN</Text>
        {entryCount === 0 ? (
          <Text style={styles.empty}>Names show up here as people pick.</Text>
        ) : (
          pool.entries.map((e: any) => (
            <ListRow
              key={e.id}
              title={e.display_name}
              subtitle={pool.options?.find((o: any) => o.id === e.option_id)?.label ?? ''}
              showChevron={false}
            />
          ))
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenGutter, gap: spacing[3], paddingBottom: spacing[8] },
  icon: { fontSize: 20, color: colors.text.secondary },
  question: {
    fontFamily: 'Barlow-Black',
    fontSize: 24,
    lineHeight: 30,
    color: colors.text.primary,
    letterSpacing: -0.4,
  },
  meta: { fontFamily: 'Inter-Regular', fontSize: 12, color: colors.text.tertiary },
  qrCard: {
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.bg.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing[5],
    marginTop: spacing[2],
  },
  qrBox: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: radius.md },
  qrHint: { fontFamily: 'Barlow-SemiBold', fontSize: 12, color: colors.text.secondary },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.bg.surface2,
    borderRadius: radius.sm,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  link: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 12, color: colors.text.secondary },
  copy: { fontFamily: 'Barlow-SemiBold', fontSize: 11, color: colors.semantic.awaiting },
  section: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    color: colors.semantic.awaiting,
    marginTop: spacing[4],
  },
  empty: { fontFamily: 'Inter-Regular', fontSize: 14, color: colors.text.tertiary },
  resultRow: { gap: 4 },
  resultTop: { flexDirection: 'row', justifyContent: 'space-between' },
  resultLabel: { fontFamily: 'Barlow-SemiBold', fontSize: 14, color: colors.text.primary },
  resultCount: { fontFamily: 'Inter-Regular', fontSize: 12, color: colors.text.secondary },
  track: { height: 10, borderRadius: 999, backgroundColor: colors.bg.surface2, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 999, backgroundColor: colors.semantic.win },
  closeBtn: { marginTop: spacing[3] },
});
