/**
 * Corner radii.
 *
 * These were 8/16/24/32/40 — pill-heavy enough that every surface read as a
 * lozenge, which is a large part of the generated-looking feel. Now 4/8/10/12/16:
 * corners are softened rather than rounded off, and the difference between the
 * steps is small enough that nesting a card inside a card still looks right.
 * `full` stays for genuine pills (buttons, chips, avatars).
 */
export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  full: 999,
} as const;

export const R = radius;
