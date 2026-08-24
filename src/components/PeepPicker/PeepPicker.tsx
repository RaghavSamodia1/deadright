import React from 'react';
import { View, Text, Image, Pressable, StyleSheet, ScrollView } from 'react-native';
import { colors, radius, spacing } from '../../tokens';
import { BottomSheet } from '../BottomSheet/BottomSheet';
import { PEEPS } from '../Avatar/peeps';
import { peepUri, peepIndexOf } from '../Avatar/Avatar';

interface PeepPickerProps {
  visible: boolean;
  /** The current avatar_url, so the one in use can be marked. */
  current?: string | null;
  /** Called with the value to store — "peep:7". */
  onPick: (uri: string) => void;
  onDismiss: () => void;
}

/**
 * Pick one of the drawn faces.
 *
 * Everybody already had one: an avatar with no photo draws the face their
 * handle happens to hash to. Which is fine as a default and no use at all if
 * you don't like the one you got, since nothing let you change it without
 * taking a photograph of yourself.
 */
export function PeepPicker({ visible, current, onPick, onDismiss }: PeepPickerProps) {
  const chosen = peepIndexOf(current);

  return (
    <BottomSheet visible={visible} onDismiss={onDismiss} dragFromHandleOnly>
      <Text style={styles.title}>Pick a character</Text>
      <Text style={styles.body}>
        No photo needed. You can change it whenever you like.
      </Text>
      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {PEEPS.map((face, i) => {
          const active = chosen === i;
          return (
            <Pressable
              key={i}
              onPress={() => {
                onPick(peepUri(i));
                onDismiss();
              }}
              accessibilityRole="button"
              accessibilityLabel={`Character ${i + 1}`}
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.cell,
                active && styles.cellActive,
                pressed && !active && styles.cellPressed,
              ]}
            >
              <Image source={face} style={styles.face} resizeMode="contain" />
            </Pressable>
          );
        })}
      </ScrollView>
    </BottomSheet>
  );
}

const CELL = 72;

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Barlow-Bold',
    fontSize: 18,
    color: colors.text.primary,
    paddingHorizontal: spacing[4],
  },
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.text.secondary,
    paddingHorizontal: spacing[4],
    marginTop: 4,
    marginBottom: spacing[3],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    justifyContent: 'center',
  },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: radius.full,
    backgroundColor: colors.bg.surface2,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellPressed: { backgroundColor: colors.bg.surface3 },
  cellActive: { borderColor: colors.semantic.awaiting },
  face: { width: CELL, height: CELL },
});
