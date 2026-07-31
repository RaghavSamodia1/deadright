export const colors = {
  brand: {
    flame: '#E2661F',
    flameDim: 'rgba(226,102,31,0.15)',
  },

  side: {
    // #6C63FF is the stock "AI product" violet. Shifted toward indigo so the
    // palette reads chosen rather than defaulted.
    a: '#5A6BE5',
    // side.a is a *graphic* colour — bars, avatar fills, borders — where 3:1
    // is the bar. As text it was never legible enough: the old #6C63FF was
    // 4.00:1 on the dark card, which the earlier contrast pass missed because
    // it audited fills and tints but not the side percentages. Use aLift for
    // any violet text; it clears 4.5:1 on base, surface-1 and the violet tint.
    aLift: '#8A97F5',
    aDim: 'rgba(90,107,229,0.15)',
    b: '#FC574E',
    bDim: 'rgba(252,87,78,0.15)',
  },

  semantic: {
    win: '#63B972',
    winDim: 'rgba(99,185,114,0.15)',
    loss: '#9C9CA3',
    awaiting: '#F7C846',
    awaitingDim: 'rgba(247,200,70,0.15)',
    disputed: '#FC574E',
    disputedDim: 'rgba(252,87,78,0.15)',
    controversial: '#9F54FF', // was #9650FF (4.36:1) — now 4.63:1 on base
    live: '#63B972',
  },

  card: {
    amber: '#F7C846',
    coral: '#FC574E',
    mint: '#63B972',
    light: '#F0F0F0',
    // Darker than side.a so off-white clears 4.5:1 (raw #6C63FF was 3.79:1),
    // and darker again so a *muted* second tier fits too: at #5F57E0 off-white
    // only just passed at 4.69 and there was no headroom left under it.
    // Card-vs-page drops to 2.60:1, which is fine — the card's 1px border is
    // what defines its edge, not the fill.
    violet: '#4A43C6',
    navy: '#161618',
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
    onLight: { primary: '#0A0A0B', muted: '#26262A', chip: 'rgba(10,10,11,0.12)' },
    // For the violet fill.
    onDark: { primary: '#F0F0F0', muted: '#C9D0DE', chip: 'rgba(240,240,240,0.10)' },
  },

  bg: {
    base: '#0A0A0B',
    surface1: '#161618',
    surface2: '#1F1F22',
    surface3: '#2A2A2E',
    overlay: 'rgba(0,0,0,0.72)',
    sheet: '#131315',
  },

  border: {
    subtle: '#1E1E21',
    default: '#2C2C31',
    strong: '#3E3E45',
  },

  text: {
    primary: '#F0F0F0',
    secondary: '#9C9CA3',
    // #5A697D failed WCAG AA on every surface (2.75:1 on surface-2).
    // Lightened to clear 4.5:1 on base, surface-1 and surface-2.
    tertiary: '#93939A',
    brand: '#E2661F',
    // Link violet only reached 4.00:1 on surface-1; lightened to 4.65:1.
    link: '#8A97F5',
    inverse: '#0A0A0B',
  },

  interactive: {
    primary: '#F7C846',
    pressed: '#DCA832',
    disabled: '#2C2C31',
    destructive: '#FC574E',
  },

  cred: {
    ring: '#F7C846',
    track: '#2A2A2E',
    positive: '#63B972',
    negative: '#FC574E',
  },
} as const;

// Convenience aliases used throughout the app
export const C = colors;
