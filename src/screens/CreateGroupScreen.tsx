import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, NavHeader, TextInput, ChoiceChip, Button } from '../components';
import { createGroup } from '../api/groups';
import { useAction } from '../hooks/useQuery';
import { isBackendConfigured } from '../lib/supabase';

const EMOJIS = ['⚽', '🏠', '🍻', '🎮', '💼', '🎓', '🏀', '🎾'];

export function CreateGroupScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('⚽');
  const { run: create, loading, error } = useAction(createGroup);

  const submit = async () => {
    if (!isBackendConfigured) return navigation.replace('ShareInvite', { name });
    const group = await create(name.trim(), emoji);
    if (group) {
      navigation.replace('ShareInvite', {
        name: group.name,
        code: group.invite_code,
        groupId: group.id,
      });
    }
  };

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader variant="modal" title="New group" onBack={() => navigation.goBack()} />
      <View style={styles.root}>
        <View style={styles.body}>
          <Text style={styles.q}>Pick an icon</Text>
          <View style={styles.emojiGrid}>
            {EMOJIS.map((e) => (
              <ChoiceChip key={e} label={e} selected={emoji === e} onPress={() => setEmoji(e)} style={styles.emojiChip} />
            ))}
          </View>

          <TextInput
            label="Group name"
            placeholder="Sunday League"
            value={name}
            onChangeText={setName}
            maxChars={30}
            error={error ? error.message : undefined}
          />
        </View>
        <Button
          label="Create group"
          onPress={submit}
          disabled={name.trim().length < 2}
          loading={loading}
          fullWidth
          style={styles.cta}
        />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.screenGutter },
  body: { flex: 1, gap: spacing[4], paddingTop: spacing[4] },
  q: { fontFamily: 'Barlow-SemiBold', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: colors.semantic.awaiting },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  emojiChip: { minWidth: 52 },
  cta: { marginBottom: spacing[6] },
});
