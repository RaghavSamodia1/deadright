// Duration values (ms)
export const duration = {
  instant: 0,
  fast: 150,
  standard: 250,
  emphasis: 380,
  celebration: 600,
} as const;

// react-native-reanimated spring configs
export const spring = {
  // Micro-interactions — quick, snappy
  fast: { damping: 18, stiffness: 180, mass: 1 },
  // Standard transitions — screen slides, modals
  standard: { damping: 18, stiffness: 180, mass: 1 },
  // Card reveals, entrance animations
  emphasis: { damping: 14, stiffness: 120, mass: 1 },
  // Win stamp, cred ring fill
  celebration: { damping: 10, stiffness: 80, mass: 1 },
} as const;

// Reduce Motion fallback — use with useReduceMotion()
export const reducedMotion = {
  duration: 150,
  easing: 'ease-out',
} as const;
