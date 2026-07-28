import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, NavHeader, Avatar, TextInput, Button } from '../components';

export function ProfileEditScreen({ navigation }: any) {
  const [name, setName] = useState('Raghav S');
  const [handle, setHandle] = useState('raghav');
  const [bio, setBio] = useState('Calls it before kickoff.');

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader
        variant="back"
        title="Edit profile"
        onBack={() => navigation.goBack()}
        rightActions={[
          { icon: <Text style={styles.save}>Save</Text>, onPress: () => navigation.goBack(), accessibilityLabel: 'Save' },
        ]}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.avatarWrap}>
          <Avatar size="xl" initials={handle.slice(0, 2).toUpperCase()} tint="a" />
          <Text style={styles.change}>Change photo</Text>
        </Pressable>

        <TextInput label="Display name" value={name} onChangeText={setName} />
        <TextInput
          label="Handle"
          value={handle}
          onChangeText={(t) => setHandle(t.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
          autoCapitalize="none"
        />
        <TextInput label="Bio" value={bio} onChangeText={setBio} multiline maxChars={80} showCounter />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenGutter, gap: spacing[4], paddingBottom: spacing[8] },
  save: { fontFamily: 'Barlow-SemiBold', fontSize: 15, color: colors.semantic.awaiting },
  avatarWrap: { alignItems: 'center', gap: spacing[2], paddingVertical: spacing[3] },
  change: { fontFamily: 'Barlow-SemiBold', fontSize: 13, color: colors.text.link },
});
