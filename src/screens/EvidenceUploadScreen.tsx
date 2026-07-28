import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, NavHeader, UploadZone, Button } from '../components';

type Item = { id: string; filename: string; sizeLabel: string };

// Evidence upload — attach proof to a resolution (bet_evidence table).
export function EvidenceUploadScreen({ navigation, route }: any) {
  const outcome = route?.params?.outcome ?? 'won';
  const [items, setItems] = useState<Item[]>([]);

  const pick = () => {
    // TODO: wire to expo-image-picker → uploadEvidence()
    setItems((prev) => [
      ...prev,
      { id: `${Date.now()}`, filename: `final-table-${prev.length + 1}.jpg`, sizeLabel: '1.8 MB · just now' },
    ]);
  };

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader variant="back" title="Evidence" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hint}>
          Screenshots, photos or a link. Evidence makes resolutions stick and heads off disputes.
        </Text>
        <UploadZone
          onPick={pick}
          items={items}
          onRemove={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
        />
        <Button
          label={items.length ? 'Submit with evidence' : 'Skip & submit'}
          onPress={() => navigation.replace(outcome === 'won' ? 'Win' : 'Root')}
          fullWidth
          style={styles.cta}
        />
      </ScrollView>
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
  cta: { marginTop: spacing[2] },
});
