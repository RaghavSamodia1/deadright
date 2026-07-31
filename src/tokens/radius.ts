/**
 * Corner radii.
 *
 * These were 8/16/24/32/40 — pill-heavy enough that every surface read as a
 * lozenge, which is a large part of the generated-looking feel. Tightened so
 * the shapes are rounded rather than rounded-off; `full` stays for genuine
 * pills (buttons, chips, avatars).
 */
export const radius = {
  none: 0,
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
} as const;

export const R = radius;
