import { TextStyle } from 'react-native';

// Font families — install via expo-font or @expo-google-fonts/barlow
export const fonts = {
  barlowBlack: 'Barlow-Black',
  barlowBold: 'Barlow-Bold',
  barlowSemiBold: 'Barlow-SemiBold',
  interRegular: 'Inter-Regular',
  interMedium: 'Inter-Medium',
  spaceMono: 'SpaceMono-Bold',
  spaceMonoRegular: 'SpaceMono-Regular',
} as const;

type TextStyleSubset = Pick<TextStyle, 'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing'>;

export const typography: Record<string, TextStyleSubset> = {
  // Display
  d1: { fontFamily: fonts.barlowBlack, fontSize: 56, lineHeight: 60, letterSpacing: -1 },
  d2: { fontFamily: fonts.barlowBold, fontSize: 44, lineHeight: 48, letterSpacing: -0.5 },

  // Headline
  h1: { fontFamily: fonts.barlowBold, fontSize: 28, lineHeight: 34, letterSpacing: -0.3 },
  h2: { fontFamily: fonts.barlowSemiBold, fontSize: 22, lineHeight: 28, letterSpacing: -0.2 },
  h3: { fontFamily: fonts.barlowSemiBold, fontSize: 18, lineHeight: 24, letterSpacing: -0.1 },

  // Body
  b1: { fontFamily: fonts.interRegular, fontSize: 15, lineHeight: 22 },
  b1Med: { fontFamily: fonts.interMedium, fontSize: 15, lineHeight: 22 },
  b2: { fontFamily: fonts.interRegular, fontSize: 13, lineHeight: 20 },
  b2Med: { fontFamily: fonts.interMedium, fontSize: 13, lineHeight: 20 },

  // Caption
  c1: { fontFamily: fonts.interMedium, fontSize: 12, lineHeight: 16 },
  c2: { fontFamily: fonts.interRegular, fontSize: 11, lineHeight: 14 },
  overline: { fontFamily: fonts.barlowSemiBold, fontSize: 11, lineHeight: 14, letterSpacing: 2 },

  // Timer — Space Mono only
  timerLg: { fontFamily: fonts.spaceMono, fontSize: 72, lineHeight: 80 },
  timerMd: { fontFamily: fonts.spaceMonoRegular, fontSize: 36, lineHeight: 44 },
  timerSm: { fontFamily: fonts.spaceMonoRegular, fontSize: 20, lineHeight: 28 },

  // Button
  btnPrimary: { fontFamily: fonts.barlowBold, fontSize: 17, lineHeight: 20, letterSpacing: 0.5 },
  btnSecondary: { fontFamily: fonts.barlowSemiBold, fontSize: 15, lineHeight: 20 },
  btnSmall: { fontFamily: fonts.barlowSemiBold, fontSize: 13, lineHeight: 16, letterSpacing: 0.5 },
} as const;

export const T = typography;
