import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, ProgressDots, Button } from '../components';

const SLIDES = [
  { emoji: '', title: 'Call it now.', body: 'Bet you won’t. I’m calling it. Capture the moment before it happens.' },
  { emoji: '', title: 'Settle it fair.', body: 'When the dust settles, both sides agree who was right. Disputes go to a group vote.' },
  { emoji: '', title: 'Build your Form.', body: 'Every call you nail builds your reputation. No money. Your word is the stake.' },
];

export function OnboardingScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const [i, setI] = useState(0);
  const scroller = useRef<ScrollView>(null);
  const last = i === SLIDES.length - 1;

  // The slides only advanced by button, which is not how anyone holds a phone
  // on a first run — the thumb swipes. The pager is the source of truth now and
  // the button just drives it, so the dots stay right whichever you use.
  const goTo = (n: number) => {
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, n));
    scroller.current?.scrollTo({ x: clamped * width, animated: true });
    setI(clamped);
  };

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    if (page !== i) setI(page);
  };

  return (
    <ScreenBackground tone="base">
      <View style={styles.root}>
        <Text style={styles.skip} onPress={() => navigation.replace('SignUp')}>
          Skip
        </Text>

        <ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onEnd}
          style={styles.pager}
        >
          {SLIDES.map((slide) => (
            <View key={slide.title} style={[styles.body, { width: width - spacing.screenGutter * 2 }]}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.text}>{slide.body}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <ProgressDots total={SLIDES.length} current={i} />
          <Button
            label={last ? 'Get started' : 'Next'}
            onPress={() => (last ? navigation.replace('SignUp') : goTo(i + 1))}
            fullWidth
          />
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  pager: { flex: 1 },
  root: { flex: 1, padding: spacing.screenGutter, paddingTop: spacing[11] },
  skip: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'right',
  },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[4] },
  emoji: { fontSize: 72 },
  title: {
    fontFamily: 'Barlow-Black',
    fontSize: 34,
    color: colors.text.primary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  text: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 300,
  },
  footer: { gap: spacing[5], paddingBottom: spacing[6], alignItems: 'center' },
});
