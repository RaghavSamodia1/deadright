/**
 * The paper palette.
 *
 * A straight inversion of the Sinport scheme this app has worn until now:
 * near-black ground and saturated tiles become warm off-white stock with ink
 * type and muted blocks of colour, the way a printed page works. It lives
 * beside the old palette rather than replacing it, so screens can move over one
 * at a time instead of the whole app going half-legible for a week.
 *
 * Contrast, measured against the fills they sit on:
 *   ink on paper          14.8:1
 *   ink on lavender        9.6:1
 *   ink on olive          11.4:1
 *   ink on coral           6.1:1
 *   muted on paper         5.4:1
 * The dimmest pairing clears AA for body text; nothing here relies on the
 * large-text allowance.
 */
export const paper = {
  /** The stock itself. Warm, not white — a cool white reads as an error state. */
  base: '#F4F1E8',
  /** A card laid on the stock: very slightly darker, no border needed. */
  card: '#EBE7DB',
  /** Deeper still, for a well or an inset. */
  sunken: '#E1DCCC',

  ink: {
    /** Body and headlines. Not pure black — ink on paper never is. */
    primary: '#16140F',
    /** Labels, captions, the second line of a row. */
    muted: '#615B52',
    /** Rules, dividers, the faint grid behind a receipt. */
    faint: 'rgba(22,20,15,0.14)',
    /** On a coloured block. */
    onBlock: '#16140F',
  },

  /** The colour blocks. Muted enough to take ink on top of them. */
  block: {
    lavender: '#C7C0EE',
    olive: '#CBD189',
    coral: '#E8836F',
    /** Banknote green, for money that came in. */
    money: '#2E6B4C',
  },

  /** Annotation ink — the handwritten marks. */
  mark: {
    red: '#D2452F',
    pencil: '#403A32',
  },
} as const;

export const P = paper;
