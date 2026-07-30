export const colors = {
  brand: {
    flame: '#FF5500',
    flameDim: 'rgba(255,85,0,0.15)',
  },

  side: {
    a: '#6C63FF',
    // For text on the violet tint fill, where raw side.a is 3.74:1.
    aLift: '#8F86FF',
    aDim: 'rgba(108,99,255,0.15)',
    b: '#FC574E',
    bDim: 'rgba(252,87,78,0.15)',
  },

  semantic: {
    win: '#8AE98D',
    winDim: 'rgba(138,233,141,0.15)',
    loss: '#96A5B9',
    awaiting: '#F7C846',
    awaitingDim: 'rgba(247,200,70,0.15)',
    disputed: '#FC574E',
    disputedDim: 'rgba(252,87,78,0.15)',
    controversial: '#9F54FF', // was #9650FF (4.36:1) — now 4.63:1 on base
    live: '#8AE98D',
  },

  card: {
    amber: '#F7C846',
    coral: '#FC574E',
    mint: '#8AE98D',
    light: '#F0F0F0',
    // Darker than side.a so off-white clears 4.5:1 (raw #6C63FF was 3.79:1),
    // and darker again so a *muted* second tier fits too: at #5F57E0 off-white
    // only just passed at 4.69 and there was no headroom left under it.
    // Card-vs-page drops to 2.60:1, which is fine — the card's 1px border is
    // what defines its edge, not the fill.
    violet: '#4A43C6',
    navy: '#151B26',
  },

  /**
   * Ink for text sitting *on* a coloured card fill.
   *
   * The app's normal text colours all assume a dark navy background, so on the
   * light fills they collapse: side.b coral on a coral card is 1.00:1 and the
   * mint timer on a mint card is 1.00:1 — invisible, not merely low contrast.
   * Cards therefore pick an ink pair by fill lightness instead of reusing the
   * global text tokens. Every pair below clears 4.5:1 on its fills.
   */
  cardInk: {
    // For amber / mint / coral fills. Muted is the darkest tier that still
    // passes on coral, the tightest of the three (4.52:1). `chip` is a wash of
    // the ink itself, so a status chip reads as a chip without needing a hue
    // that would clash with the fill: an AWAITING chip used amber-on-amber and
    // vanished completely (1.00:1); on this it is 9.34:1.
    onLight: { primary: '#0E121A', muted: '#232A3A', chip: 'rgba(14,18,26,0.12)' },
    // For the violet fill.
    onDark: { primary: '#F0F0F0', muted: '#C9D0DE', chip: 'rgba(240,240,240,0.10)' },
  },

  bg: {
    base: '#0E121A',
    surface1: '#151B26',
    surface2: '#1C2534',
    surface3: '#243042',
    overlay: 'rgba(0,0,0,0.72)',
    sheet: '#121820',
  },

  border: {
    subtle: '#1C2534',
    default: '#283447',
    strong: '#3C5070',
  },

  text: {
    primary: '#F0F0F0',
    secondary: '#96A5B9',
    // #5A697D failed WCAG AA on every surface (2.75:1 on surface-2).
    // Lightened to clear 4.5:1 on base, surface-1 and surface-2.
    tertiary: '#798DA8',
    brand: '#FF5500',
    // Link violet only reached 4.00:1 on surface-1; lightened to 4.65:1.
    link: '#7C71FF',
    inverse: '#0E121A',
  },

  interactive: {
    primary: '#F7C846',
    pressed: '#DCA832',
    disabled: '#283447',
    destructive: '#FC574E',
  },

  cred: {
    ring: '#F7C846',
    track: '#243042',
    positive: '#8AE98D',
    negative: '#FC574E',
  },
} as const;

// Convenience aliases used throughout the app
export const C = colors;
