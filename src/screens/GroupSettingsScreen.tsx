import React from 'react';
import { Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { colors, spacing } from '../tokens';
import {
  ScreenBackground,
  NavHeader,
  SettingsRow,
  SettingsSection,
  ActionSheet,
} from '../components';
import { getGroup, setGroupCurrency } from '../api/groups';
import { getJar } from '../api/jar';
import { useQuery, useAction } from '../hooks/useQuery';
import { uidOrNull } from '../lib/supabase';
import { humanError } from '../lib/errors';
import { CURRENCY_CODES, currencyLabel, formatMoney } from '../lib/money';

/**
 * Per-group settings.
 *
 * Currency lives here rather than in user settings because the money does. Every
 * amount in a group — jar violations, the cap, stakes, the ledger — is shared, so
 * reading it in whichever unit each member happened to pick meant the same jar
 * showed as ₹2 to one person and $2 to another, with nothing converted between
 * them. One unit per group, set by an admin, read by everyone.
 */
export function GroupSettingsScreen({ navigation, route }: any) {
  const groupId: string | undefined = route?.params?.id;
  const groupName: string = route?.params?.name ?? 'Group';
  const [currencyOpen, setCurrencyOpen] = React.useState(false);

  const { data, loading, error, refetch } = useQuery<any>(
    async () => {
      if (!groupId) return null;
      const [group, uid, jar] = await Promise.all([
        getGroup(groupId),
        uidOrNull(),
        // Whether the group already holds money decides how loudly we warn: a
        // currency change relabels existing amounts, it cannot convert them.
        getJar(groupId).catch(() => null),
      ]);
      return { group, uid, jar };
    },
    null,
    [groupId],
  );

  const group = data?.group;
  const currency: string = (group?.currency ?? 'GBP').toUpperCase();
  const members: any[] = group?.members ?? [];
  const iAmAdmin = members.some(
    (m: any) => (m.profile?.id ?? m.user_id) === data?.uid && m.role === 'admin',
  );
  const heldCents: number = data?.jar?.totalCents ?? 0;

  const { run: doSetCurrency, error: saveError } = useAction(setGroupCurrency);

  const apply = async (code: string) => {
    if (!groupId || code === currency) return;
    await doSetCurrency(groupId, code);
    refetch();
  };

  const choose = (code: string) => {
    if (code === currency) return;
    if (heldCents > 0) {
      // Relabelling is the honest description — say so before doing it.
      Alert.alert(
        `Change to ${code}?`,
        `This jar holds ${formatMoney(heldCents, currency)}. Changing the currency ` +
          `re-labels it as ${formatMoney(heldCents, code)} — nothing is converted, ` +
          `and everyone in ${groupName} sees the change.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: `Use ${code}`, style: 'destructive', onPress: () => apply(code) },
        ],
      );
      return;
    }
    apply(code);
  };

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader
        variant="back"
        title="Group settings"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error ? (
          <Text style={styles.error}>{humanError(error)}</Text>
        ) : (
          <>
            <SettingsSection title="Money">
              <SettingsRow
                icon="coin"
                label="Currency"
                value={loading ? '…' : currencyLabel(currency)}
                onPress={
                  iAmAdmin
                    ? () => setCurrencyOpen(true)
                    : () =>
                        Alert.alert(
                          'Admins only',
                          `Only an admin of ${groupName} can change the currency.`,
                        )
                }
              />
            </SettingsSection>

            <Text style={styles.note}>
              Every amount in {groupName} — the jar, stakes and the ledger — is read in
              this currency by all members. It sets the unit; it never converts.
            </Text>

            {!iAmAdmin && (
              <Text style={styles.note}>
                You're a member of this group, so the currency is read-only here.
              </Text>
            )}

            {saveError && <Text style={styles.error}>{humanError(saveError)}</Text>}
          </>
        )}
      </ScrollView>

      <ActionSheet
        visible={currencyOpen}
        title="Group currency"
        options={CURRENCY_CODES.map((code) => ({
          label: currencyLabel(code),
          primary: code === currency,
          onPress: () => choose(code),
        }))}
        onDismiss={() => setCurrencyOpen(false)}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.screenGutter,
    gap: spacing[4],
    paddingBottom: spacing[8],
  },
  note: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: colors.text.tertiary,
  },
  error: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.semantic.loss,
  },
});
