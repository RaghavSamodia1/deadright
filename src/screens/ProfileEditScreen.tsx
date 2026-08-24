import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, NavHeader, Avatar, TextInput, Button, ActionSheet } from '../components';
import { getMyProfile, updateProfile, uploadAvatar, removeAvatar, isHandleAvailable } from '../api/profile';
import { takePhoto, pickFromLibrary } from '../lib/evidence';
import { useQuery } from '../hooks/useQuery';
import { isBackendConfigured } from '../lib/supabase';
import { humanError } from '../lib/errors';

/** profiles.handle: check (handle ~ '^[a-z0-9_]{3,20}$'). */
const HANDLE_RE = /^[a-z0-9_]{3,20}$/;
/** profiles.display_name: between 1 and 24. profiles.bio: <= 120. */
const NAME_MAX = 24;
const BIO_MAX = 120;

type HandleState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'free' }
  | { kind: 'taken' }
  | { kind: 'invalid'; why: string };

/**
 * Edit your own profile.
 *
 * Three things here were decoration. "Change photo" was a Pressable with no
 * onPress, so the one control on the screen that looked like it did the most
 * did nothing at all. The bio counter capped at 80 while the column allows 120.
 * And the handle field let you type one somebody already had and find out from
 * a constraint violation on save, even though handle_available() has existed
 * since 00034 and nothing ever called it.
 */
export function ProfileEditScreen({ navigation }: any) {
  const { data: profile, refetch } = useQuery(getMyProfile, {
    display_name: '',
    handle: '',
    bio: '',
    avatar_url: null,
  } as any);

  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [busyPhoto, setBusyPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [handleState, setHandleState] = useState<HandleState>({ kind: 'idle' });

  // Seed the fields once the profile lands, without clobbering edits in flight.
  useEffect(() => {
    if (loaded || !profile?.handle) return;
    setName(profile.display_name ?? '');
    setHandle(profile.handle ?? '');
    setBio(profile.bio ?? '');
    setLoaded(true);
  }, [profile, loaded]);

  const originalHandle = (profile?.handle ?? '').toLowerCase();
  const handleChanged = loaded && handle.toLowerCase() !== originalHandle;

  // Debounced, because it fires per keystroke otherwise, and only when the
  // handle has actually changed — your own handle is always "taken" by you.
  useEffect(() => {
    if (!handleChanged) return setHandleState({ kind: 'idle' });
    if (!HANDLE_RE.test(handle)) {
      setHandleState({
        kind: 'invalid',
        why:
          handle.length < 3
            ? 'At least 3 characters.'
            : handle.length > 20
              ? 'At most 20 characters.'
              : 'Letters, numbers and underscores only.',
      });
      return;
    }
    setHandleState({ kind: 'checking' });
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const free = await isHandleAvailable(handle);
        if (alive) setHandleState({ kind: free ? 'free' : 'taken' });
      } catch {
        if (alive) setHandleState({ kind: 'idle' });
      }
    }, 400);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [handle, handleChanged]);

  const setPhoto = async (pick: () => Promise<{ uri: string } | null>) => {
    setBusyPhoto(true);
    try {
      const photo = await pick();
      if (photo) {
        await uploadAvatar(photo.uri);
        refetch();
      }
    } catch (e) {
      Alert.alert('Couldn’t change your photo', humanError(e));
    } finally {
      setBusyPhoto(false);
    }
  };

  const dropPhoto = async () => {
    setBusyPhoto(true);
    try {
      await removeAvatar();
      refetch();
    } catch (e) {
      Alert.alert('Couldn’t remove your photo', humanError(e));
    } finally {
      setBusyPhoto(false);
    }
  };

  const nameOk = name.trim().length > 0 && name.trim().length <= NAME_MAX;
  const handleOk =
    !handleChanged || handleState.kind === 'free';
  const ready = loaded && nameOk && handleOk && bio.length <= BIO_MAX && !saving;

  const submit = async () => {
    if (!isBackendConfigured) return navigation.goBack();
    if (!ready) return;
    setSaving(true);
    try {
      await updateProfile({
        display_name: name.trim(),
        handle: handle.trim().toLowerCase(),
        bio: bio.trim() || null,
      } as any);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Couldn’t save', humanError(e));
    } finally {
      setSaving(false);
    }
  };

  const initials = (profile?.display_name || handle || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? '')
    .join('');

  const handleHint: Record<HandleState['kind'], string> = {
    idle: 'How people find you. You can change it later.',
    checking: 'Checking…',
    free: `@${handle} is free.`,
    taken: `@${handle} is taken.`,
    invalid: handleState.kind === 'invalid' ? handleState.why : '',
  };

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader
        variant="back"
        title="Edit profile"
        onBack={() => navigation.goBack()}
        rightActions={[
          {
            icon: (
              <Text style={[styles.save, !ready && styles.saveOff]}>
                {saving ? '…' : 'Save'}
              </Text>
            ),
            onPress: submit,
            accessibilityLabel: 'Save profile',
          },
        ]}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <Pressable
          style={styles.avatarWrap}
          onPress={() => setPhotoOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
        >
          <Avatar
            size="xl"
            uri={profile?.avatar_url ?? undefined}
            initials={initials || '?'}
            seed={handle}
          />
          {busyPhoto ? (
            <ActivityIndicator color={colors.semantic.awaiting} />
          ) : (
            <Text style={styles.change}>
              {profile?.avatar_url ? 'Change photo' : 'Add a photo'}
            </Text>
          )}
        </Pressable>

        <TextInput
          label="Display name"
          value={name}
          onChangeText={setName}
          maxChars={NAME_MAX}
          showCounter
        />
        <TextInput
          label="Handle"
          value={handle}
          onChangeText={(t) => setHandle(t.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
          autoCapitalize="none"
          autoCorrect={false}
          helper={handleHint[handleState.kind]}
          error={
            handleState.kind === 'taken' || handleState.kind === 'invalid'
              ? handleHint[handleState.kind]
              : undefined
          }
        />
        <TextInput
          label="Bio"
          value={bio}
          onChangeText={setBio}
          multiline
          maxChars={BIO_MAX}
          showCounter
        />
        <Button
          label="Save changes"
          onPress={submit}
          loading={saving}
          disabled={!ready}
          fullWidth
        />
      </ScrollView>

      <ActionSheet
        visible={photoOpen}
        title="Profile photo"
        options={[
          {
            label: 'Take a photo',
            onPress: () =>
              setPhoto(() =>
                takePhoto({ square: true, reason: 'DeadRight needs the camera for your profile photo.' }),
              ),
          },
          {
            label: 'Choose from library',
            onPress: () =>
              setPhoto(() =>
                pickFromLibrary({ square: true, reason: 'DeadRight needs your photos to set a profile picture.' }),
              ),
          },
          ...(profile?.avatar_url
            ? [{ label: 'Remove photo', destructive: true, onPress: dropPhoto }]
            : []),
        ]}
        onDismiss={() => setPhotoOpen(false)}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenGutter, gap: spacing[4], paddingBottom: spacing[8] },
  save: { fontFamily: 'Barlow-SemiBold', fontSize: 15, color: colors.semantic.awaiting },
  saveOff: { color: colors.text.tertiary },
  avatarWrap: { alignItems: 'center', gap: spacing[2], paddingVertical: spacing[3] },
  change: { fontFamily: 'Barlow-SemiBold', fontSize: 13, color: colors.text.link },
});
