import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import { ScreenBackground, NavHeader, TextInput, Button } from '../components';
import { deleteAccount } from '../api/auth';
import { useAction } from '../hooks/useQuery';
import { isBackendConfigured } from '../lib/supabase';

// Destructive, irreversible — requires typing DELETE to confirm.
export function DeleteAccountScreen({ navigation }: any) {
  const [confirm, setConfirm] = useState('');
  const armed = confirm.trim().toUpperCase() === 'DELETE';
  const { run: destroy, loading, error } = useAction(deleteAccount);

  const submit = async () => {
    if (!isBackendConfigured) return navigation.goBack();
    const done = await destroy();
    // On success the session clears and RootNavigator swaps to the auth stack
    // by itself — no navigation call needed (and any we made would be dropped).
    if (done !== null) setConfirm('');
  };

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader variant="back" title="Delete account" onBack={() => navigation.goBack()} />
      <View style={styles.root}>
        <View style={styles.body}>
          <View style={styles.warnBox}>
            <Text style={styles.warnTitle}>This can’t be undone</Text>
            <Text style={styles.warnText}>
              Your bets, Cred score, ledger history and groups you own will be permanently removed.
            </Text>
          </View>

          <Text style={styles.label}>Type DELETE to confirm</Text>
          <TextInput
            placeholder="DELETE"
            value={confirm}
            onChangeText={setConfirm}
            autoCapitalize="characters"
            error={error ? error.message : undefined}
          />
        </View>

        <View style={styles.footer}>
          <Button
            label="Delete my account"
            onPress={submit}
            variant="destructive"
            disabled={!armed}
            loading={loading}
            fullWidth
          />
          <Button label="Keep my account" onPress={() => navigation.goBack()} variant="ghost" fullWidth />
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.screenGutter },
  body: { flex: 1, gap: spacing[4], paddingTop: spacing[4] },
  warnBox: {
    backgroundColor: colors.semantic.disputedDim,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.semantic.disputed,
    padding: spacing[4],
    gap: spacing[2],
  },
  warnTitle: { fontFamily: 'Barlow-Bold', fontSize: 16, color: colors.semantic.disputed },
  warnText: { fontFamily: 'Inter-Regular', fontSize: 14, lineHeight: 21, color: colors.text.secondary },
  label: { fontFamily: 'Barlow-SemiBold', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: colors.text.secondary },
  footer: { gap: spacing[2], paddingBottom: spacing[6] },
});
