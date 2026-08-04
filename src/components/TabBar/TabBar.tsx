import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, spacing } from '../../tokens';

export type TabName = 'feed' | 'search' | 'create' | 'alerts' | 'profile';

interface TabBarProps {
  active: TabName;
  onPress: (tab: TabName) => void;
  onCreatePress: () => void;
  alertCount?: number;
}

const TABS: Array<{ name: TabName; label: string; icon: string }> = [
  { name: 'feed', label: 'Feed', icon: '⌂' },
  { name: 'search', label: 'Search', icon: '⌕' },
  { name: 'create', label: '', icon: '+' },
  { name: 'alerts', label: 'Alerts', icon: '🔔' },
  { name: 'profile', label: 'Profile', icon: '◉' },
];

export function TabBar({ active, onPress, onCreatePress, alertCount = 0 }: TabBarProps) {
  const insets = useSafeAreaInsets();

  const handlePress = (tab: TabName) => {
    if (tab === 'create') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onCreatePress();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(tab);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.inner}>
        {TABS.map((tab) => {
          const isCreate = tab.name === 'create';
          const isActive = active === tab.name;

          if (isCreate) {
            return (
              <Pressable
                key={tab.name}
                onPress={() => handlePress('create')}
                style={({ pressed }) => [
                  styles.fab,
                  { transform: [{ scale: pressed ? 0.9 : 1 }] },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Create a bet"
              >
                <Text style={styles.fabIcon}>+</Text>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={tab.name}
              onPress={() => handlePress(tab.name)}
              style={styles.tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
            >
              <View>
                <Text style={[styles.icon, { color: isActive ? colors.interactive.primary : colors.text.tertiary }]}>
                  {tab.icon}
                </Text>
                {tab.name === 'alerts' && alertCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{alertCount > 9 ? '9+' : alertCount}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.label, { color: isActive ? colors.interactive.primary : colors.text.tertiary }]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg.surface1,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  inner: {
    height: spacing.tabBarContent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    height: spacing.touchTarget,
  },
  icon: {
    fontSize: 22,
    includeFontPadding: false,
  },
  label: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 10,
    includeFontPadding: false,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.interactive.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: colors.interactive.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 28,
    color: colors.text.inverse,
    fontFamily: 'Barlow-Bold',
    includeFontPadding: false,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.interactive.destructive,
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontFamily: 'Barlow-Bold',
    fontSize: 9,
    color: colors.text.primary,
  },
});
