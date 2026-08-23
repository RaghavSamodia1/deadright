export const colors = {
  brand: {
    flame: '#E2661F',
    flameDim: 'rgba(226,102,31,0.15)',
  },

  side: {
    // The sides were a saturated blue and red, the last two colours not in the
    // palette. They are neutral now — bone against slate — which is the same
    // reasoning as the cards: colour is reserved for status, so the split bar
    // shouldn't spend any. A 2.4:1 step between the halves keeps them readable
    // at a glance, and neither reads as the better side to pick.
    a: '#E8B33C',
    // Bone clears 4.5:1 as text on every surface, so unlike the old violet it
    // needs no separate lifted variant — aLift is kept as an alias for callers.
    aLift: '#E8B33C',
    aDim: 'rgba(232,179,60,0.15)',
    b: '#4FA8A0',
    bDim: 'rgba(79,168,160,0.15)',
  },

  semantic: {
    win: '#63B972',
    winDim: 'rgba(99,185,114,0.15)',
    loss: '#9C9CA3',
    awaiting: '#F7C846',
    awaitingDim: 'rgba(247,200,70,0.15)',
    disputed: '#FC574E',
    disputedDim: 'rgba(252,87,78,0.15)',
    controversial: '#B6B6BE',
    live: '#63B972',
  },

  card: {
    amber: '#F7C846',
    coral: '#FC574E',
    mint: '#63B972',
    light: '#F0F0F0',
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
    // Lifted off pure black and given the navy the design doc always specified.
    // Near-black made every surface read as a hole cut in the screen; a floor
    // with some light in it lets the glass sit *on* something. text.primary
    // still clears 16:1 here, and text.tertiary 5.98:1.
    base: '#11151E',
    // surface-1 follows the base into the navy family. surface-2 and -3 stay
    // put: lifting them dropped text.tertiary to 4.21 and 3.41:1, and they are
    // what chips and inputs sit on.
    surface1: '#232834',
    surface2: '#2A2A2F',
    surface3: '#34343A',
    overlay: 'rgba(0,0,0,0.72)',
    sheet: '#161B26',
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
    // Captions on a tinted tile. #9C9CA3 lands at 4.49:1 on amber-tint over the
    // lifted base — a hair under AA — and this clears 5.18:1 on the worst of
    // the five tints.
    onTint: '#A8A8AF',
    brand: '#E2661F',
    link: '#F7C846',
    inverse: '#0A0A0B',
  },

  interactive: {
    primary: '#F7C846',
    pressed: '#DCA832',
    disabled: '#2C2C31',
    destructive: '#FC574E',
  },

  form: {
    ring: '#F7C846',
    track: '#2A2A2E',
    positive: '#63B972',
    negative: '#FC574E',
  },
} as const;

// Convenience aliases used throughout the app
export const C = colors;
