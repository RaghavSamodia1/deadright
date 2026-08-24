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
 *
 * The lip runs the whole way round rather than sitting on the top and bottom
 * only. Two bands stop dead where the corner starts to turn, so the edge reads
 * as a pair of flat stripes laid on a flat card; carried through the sides it
 * follows the curve, and the surface reads as something with a rounded rim that
 * light is falling across. Left and right take a value between the lit top and
 * the shaded bottom, which is where a rounded edge would actually sit.
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
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.09)',
    borderTopColor: 'rgba(255,255,255,0.28)',
    borderBottomColor: 'rgba(0,0,0,0.88)',
    ...shadow(14, 26, 0.85, 16),
  } as ViewStyle,

  /** Saturated fills, where both edges have something to catch. */
  bright: {
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.34)',
    borderTopColor: 'rgba(255,255,255,0.78)',
    borderBottomColor: 'rgba(0,0,0,0.38)',
    ...shadow(16, 30, 0.9, 20),
  } as ViewStyle,

  /** List rows: the same light, turned down. */
  row: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.07)',
    borderTopColor: 'rgba(255,255,255,0.20)',
    borderBottomColor: 'rgba(0,0,0,0.78)',
    ...shadow(10, 20, 0.75, 11),
  } as ViewStyle,
};
