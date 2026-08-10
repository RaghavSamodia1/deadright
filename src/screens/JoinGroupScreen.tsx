import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import { ScreenBackground, NavHeader, TextInput, AvatarStack, Button } from '../components';
import { joinGroupByCode } from '../api/groups';
import { useAction } from '../hooks/useQuery';
import { isBackendConfigured } from '../lib/supabase';
import { humanError } from '../lib/errors';

// Join a group by its 6-char code (join_group_by_code RPC).
export function JoinGroupScreen({ navigation }: any) {
  const [code, setCode] = useState('');
  const found = code.trim().length === 6;
  const { run: join, loading, error } = useAction(joinGroupByCode);

  const submit = async () => {
    if (!isBackendConfigured) return navigation.replace('Group', { name: 'Flatmates' });
    const group = await join(code.trim());
    if (group) navigation.replace('Group', { id: group.id, name: group.name });
  };

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader variant="modal" title="Join a group" onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.body}>
          <TextInput
            label="Invite code"
            placeholder="ABC123"
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
            autoCapitalize="characters"
            autoFocus
            error={error ? humanError(error) : undefined}
          />

          {found && (
            <View style={styles.preview}>
              <Text style={styles.previewEmoji}>🏠</Text>
              <Text style={styles.previewName}>Flatmates</Text>
              <AvatarStack people={[{ initials: 'AB' }, { initials: 'JK' }, { initials: 'PR' }]} max={3} size="sm" />
              <Text style={styles.previewSub}>5 members · 12 open bets</Text>
            </View>
          )}
        </View>
        <Button
          label="Join group"
          onPress={submit}
          disabled={!found}
          loading={loading}
          fullWidth
          style={styles.cta}
        />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: spacing.screenGutter,
  },
  body: { gap: spacing[5], paddingTop: spacing[4] },
  preview: {
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.bg.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing[6],
  },
  previewEmoji: { fontSize: 40 },
  previewName: { fontFamily: 'Barlow-Bold', fontSize: 20, color: colors.text.primary },
  previewSub: { fontFamily: 'Inter-Regular', fontSize: 12, color: colors.text.tertiary },
  cta: { marginBottom: spacing[6] },
});
