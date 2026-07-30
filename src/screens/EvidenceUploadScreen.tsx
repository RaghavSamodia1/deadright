import React, { useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import { ScreenBackground, NavHeader, UploadZone, Button, ActionSheet } from '../components';
import { takePhoto, pickFromLibrary, formatSize, type PickedPhoto } from '../lib/evidence';
import { addEvidence } from '../api/resolution';
import { isBackendConfigured } from '../lib/supabase';

type Item = { id: string; filename: string; sizeLabel: string; uri: string };

// Evidence upload — attach proof to a resolution (bet_evidence + storage).
export function EvidenceUploadScreen({ navigation, route }: any) {
  const outcome = route?.params?.outcome ?? 'won';
  const betId = route?.params?.betId ?? route?.params?.id;
  const [items, setItems] = useState<Item[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = (photo: PickedPhoto | null) => {
    if (!photo) return;
    setItems((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        filename: photo.uri.split('/').pop() ?? 'evidence.jpg',
        sizeLabel: formatSize(photo.fileSize),
        uri: photo.uri,
      },
    ]);
  };

  const submit = async () => {
    setError(null);
    // Demo mode: nothing to upload to.
    if (!isBackendConfigured || !betId) {
      return navigation.replace(outcome === 'won' ? 'Win' : 'Root', { betId });
    }
    setUploading(true);
    try {
      // Each photo becomes its own bet_evidence row.
      for (const item of items) {
        await addEvidence(betId, undefined, item.uri);
      }
      navigation.replace(outcome === 'won' ? 'Win' : 'Root', { betId });
    } catch (e) {
      setError((e as Error).message ?? 'Upload failed — check your connection.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader variant="back" title="Evidence" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hint}>
          Screenshots or photos. Evidence makes resolutions stick and heads off disputes.
        </Text>

        <UploadZone
          onPick={() => setSheetOpen(true)}
          items={items.map(({ id, filename, sizeLabel }) => ({ id, filename, sizeLabel }))}
          onRemove={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
          hint="Tap to snap or choose a photo"
        />

        {/* Thumbnails — seeing the shot beats reading a filename */}
        {items.length > 0 && (
          <View style={styles.thumbRow}>
            {items.map((i) => (
              <Pressable
                key={i.id}
                onLongPress={() => setItems((prev) => prev.filter((x) => x.id !== i.id))}
                accessibilityLabel="Evidence photo, long press to remove"
              >
                <Image source={{ uri: i.uri }} style={styles.thumb} />
              </Pressable>
            ))}
          </View>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <Button
          label={items.length ? `Submit with ${items.length} photo${items.length > 1 ? 's' : ''}` : 'Skip & submit'}
          onPress={submit}
          loading={uploading}
          fullWidth
          style={styles.cta}
        />
      </ScrollView>

      <ActionSheet
        visible={sheetOpen}
        onDismiss={() => setSheetOpen(false)}
        title="Add evidence"
        options={[
          { label: '📷  Take a photo', onPress: async () => add(await takePhoto()) },
          { label: '🖼  Choose from library', onPress: async () => add(await pickFromLibrary()) },
        ]}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenGutter, gap: spacing[4], paddingBottom: spacing[8] },
  hint: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 21,
    color: colors.text.secondary,
  },
  thumbRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  error: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.interactive.destructive,
  },
  cta: { marginTop: spacing[2] },
});
