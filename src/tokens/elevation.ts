import { Platform, ViewStyle } from 'react-native';

/**
 * Depth, on a near-black page.
 *
 * The obvious move — a black drop shadow — is almost nothing to look at over
 * #0A0A0B, because there is no ground left to darken. What actually reads as
 * raised here is the edges: a lit top and a shaded bottom, as though the light
 * sits above the screen. A shadow is kept as well, small, because Android's
 * elevation genuinely lifts a surface off the layer beneath it.
 *
 * Two strengths, because the same edge does opposite things on opposite fills.
 * On amber a white top edge is a bright bevel and a black bottom edge is a
 * shadow inside the shape; on a near-black card the white edge is the only one
 * of the pair that can be seen at all.
 */
const shadow = (height: number, radius: number, opacity: number, android: number): ViewStyle =>
  Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: { elevation: android },
    default: {},
  }) as ViewStyle;

export const elevation = {
  /** Dark surfaces: cards, rows, navy tiles. */
  card: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.10)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.55)',
    ...shadow(5, 10, 0.5, 5),
  } as ViewStyle,

  /** Saturated fills, where both edges have something to catch. */
  bright: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.42)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0,0,0,0.20)',
    ...shadow(6, 12, 0.55, 7),
  } as ViewStyle,

  /** List rows: the same light, turned down. */
  row: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.45)',
    ...shadow(3, 6, 0.4, 3),
  } as ViewStyle,
};
