import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, spring } from '../../tokens';

interface SideBarProps {
  sideAPercent: number; // 0–100
  sideACount?: number;
  sideBCount?: number;
  animated?: boolean;
  showLabels?: boolean;
  style?: ViewStyle;
}

export function SideBar({
  sideAPercent,
  sideACount,
  sideBCount,
  animated = true,
  showLabels = true,
  style,
}: SideBarProps) {
  const sideBPercent = 100 - sideAPercent;
  const aWidth = useSharedValue(0);

  useEffect(() => {
    aWidth.value = withSpring(sideAPercent / 100, spring.emphasis);
  }, [sideAPercent]);

  const aBarStyle = useAnimatedStyle(() => ({
    flex: animated ? aWidth.value : sideAPercent / 100,
  }));

  return (
    <View style={[styles.container, style]}>
      {showLabels && (
        <View style={styles.labels}>
          <View style={styles.labelLeft}>
            <Text style={styles.sideLabel}>Side A</Text>
            <Text style={[styles.pct, { color: colors.side.a }]}>{sideAPercent}%</Text>
            {sideACount !== undefined && (
              <Text style={styles.count}>{sideACount} {sideACount === 1 ? 'person' : 'people'}</Text>
            )}
          </View>
          <View style={styles.labelRight}>
            {sideBCount !== undefined && (
              <Text style={styles.count}>{sideBCount} {sideBCount === 1 ? 'person' : 'people'}</Text>
            )}
            <Text style={[styles.pct, { color: colors.side.b }]}>{sideBPercent}%</Text>
            <Text style={styles.sideLabel}>Side B</Text>
          </View>
        </View>
      )}

      <View style={styles.track}>
        {animated ? (
          <Animated.View style={[styles.fillA, aBarStyle]} />
        ) : (
          <View style={[styles.fillA, { flex: sideAPercent / 100 }]} />
        )}
        <View style={styles.gap} />
        <View style={[styles.fillB, { flex: sideBPercent / 100 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  labelLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  labelRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sideLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: colors.text.tertiary,
  },
  pct: {
    fontFamily: 'Barlow-Bold',
    fontSize: 10,
  },
  count: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: colors.text.tertiary,
  },
  track: {
    height: 8,
    borderRadius: 999,
    flexDirection: 'row',
    backgroundColor: colors.bg.surface2,
    overflow: 'hidden',
  },
  fillA: {
    backgroundColor: colors.side.a,
    borderRadius: 999,
  },
  gap: { width: 2 },
  fillB: {
    backgroundColor: colors.side.b,
    borderRadius: 999,
  },
});
