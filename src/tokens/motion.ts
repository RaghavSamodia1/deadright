// Duration values (ms)
export const duration = {
  instant: 0,
  fast: 150,
  standard: 250,
  emphasis: 380,
  celebration: 600,
} as const;

// react-native-reanimated spring configs.
//
// Bounce is the damping ratio: damping / (2 * sqrt(stiffness * mass)). Below 1
// the spring overshoots and wobbles back, and these all sat at 0.56–0.67, which
// read as springy on everything at once — sheets, the side bar fill, tile
// presses. Raised to near-critical for interface motion, so things arrive and
// stop, with the overshoot kept only where it is the point.
export const spring = {
  // Micro-interactions — quick, snappy. Ratio 0.97: settles without a wobble.
  fast: { damping: 26, stiffness: 180, mass: 1 },
  // Standard transitions — screen slides, modals. Ratio 0.97.
  standard: { damping: 26, stiffness: 180, mass: 1 },
  // Card reveals, sheets, entrance animations. Ratio 0.91 — a hint of give.
  emphasis: { damping: 20, stiffness: 120, mass: 1 },
  // Win stamp, cred ring fill. Ratio 0.78: still lands with some life, since a
  // called-it moment is meant to feel like one.
  celebration: { damping: 14, stiffness: 80, mass: 1 },
} as const;

// Reduce Motion fallback — use with useReduceMotion()
export const reducedMotion = {
  duration: 150,
  easing: 'ease-out',
} as const;
