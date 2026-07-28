import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { spacing, colors } from '../tokens';
import {
  ScreenBackground,
  NavHeader,
  JarCard,
  ViolationRow,
  Button,
  Banner,
} from '../components';
import { AddViolationSheet } from './AddViolationSheet';

// Mock data — replace with Supabase query
const MOCK_VIOLATIONS = [
  { id: '1', member: { handle: '@marcus', initials: 'MJ' }, rule: 'Swearing', amount: '+$1.00', timestamp: '2h ago', disputable: true },
  { id: '2', member: { handle: '@raghav', initials: 'RS' }, rule: 'Late to plans', amount: '+$5.00', timestamp: '1d ago', ownedUp: true },
  { id: '3', member: { handle: '@abi', initials: 'AK' }, rule: 'Phone at dinner', amount: '+$2.00', timestamp: '2d ago' },
  { id: '4', member: { handle: '@marcus', initials: 'MJ' }, rule: 'Swearing', amount: '+$1.00', timestamp: '3d ago' },
];

export function SwearJarScreen({ navigation }: any) {
  const [addVisible, setAddVisible] = useState(false);
  const total = 23.5;
  const cap = 50;

  return (
    <ScreenBackground tone="base">
      <NavHeader
        variant="back"
        title="Cookie Jar"
        onBack={() => navigation.goBack()}
        rightActions={[
          {
            icon: <Text style={styles.rulesIcon}>📜</Text>,
            onPress: () => navigation.navigate('JarRules'),
            accessibilityLabel: 'Jar rules',
          },
        ]}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <JarCard
          total={`$${total.toFixed(2)}`}
          groupName="Sunday League"
          contributionCount={MOCK_VIOLATIONS.length}
          capProgress={total / cap}
          capLabel={`Cap: $${cap} — jar settles when full`}
        />

        {total / cap > 0.8 && (
          <Banner
            tone="awaiting"
            title="Jar almost full"
            body="Hitting the cap forces a group settle-up. Pizza night?"
            actionLabel="Plan settle-up"
            onAction={() => {}}
          />
        )}

        <View style={styles.actions}>
          <Button label="ADD VIOLATION" onPress={() => setAddVisible(true)} fullWidth />
          <Button label="Own up 😇" onPress={() => {}} variant="secondary" fullWidth />
        </View>

        <Text style={styles.sectionTitle}>RECENT VIOLATIONS</Text>
        <View style={styles.list}>
          {MOCK_VIOLATIONS.map((v) => (
            <ViolationRow key={v.id} {...v} />
          ))}
        </View>
      </ScrollView>

      <AddViolationSheet visible={addVisible} onDismiss={() => setAddVisible(false)} />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.screenGutter,
    gap: spacing[4],
    paddingBottom: spacing[8],
  },
  rulesIcon: { fontSize: 18 },
  actions: { gap: spacing[2] },
  sectionTitle: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    color: colors.semantic.awaiting,
    marginTop: spacing[2],
  },
  list: { gap: spacing[2] },
});
