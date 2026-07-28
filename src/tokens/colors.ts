export const colors = {
  brand: {
    flame: '#FF5500',
    flameDim: 'rgba(255,85,0,0.15)',
  },

  side: {
    a: '#6C63FF',
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
    controversial: '#9650FF',
    live: '#8AE98D',
  },

  card: {
    amber: '#F7C846',
    coral: '#FC574E',
    mint: '#8AE98D',
    light: '#F0F0F0',
    violet: '#6C63FF',
    navy: '#151B26',
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
    tertiary: '#5A697D',
    brand: '#FF5500',
    link: '#6C63FF',
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
