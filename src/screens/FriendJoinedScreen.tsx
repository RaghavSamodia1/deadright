import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, Avatar, Button } from '../components';

// Peak — a friend joined from your invite. Violet (side-a).
export function FriendJoinedScreen({ navigation, route }: any) {
  const handle = route?.params?.handle ?? '@abi';
  const initials = route?.params?.initials ?? 'AB';

  return (
    <ScreenBackground tone="side-a">
      <View style={styles.root}>
        <View style={styles.center}>
          <Avatar size="xl" initials={initials} tint="a" />
          <Text style={styles.title}>{handle} joined!</Text>
          <Text style={styles.sub}>They came in on your invite. Time to start one and drag them in.</Text>
        </View>
        <View style={styles.footer}>
          <Button label="Bet them something" onPress={() => navigation.replace('CreateBet')} variant="secondary" fullWidth />
          <Button label="Later" onPress={() => navigation.goBack()} fullWidth />
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.screenGutter, paddingBottom: spacing[6] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[4] },
  title: {
    fontFamily: 'Barlow-Black',
    fontSize: 32,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  sub: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    lineHeight: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    maxWidth: 280,
    opacity: 0.9,
  },
  footer: { gap: spacing[3] },
});
