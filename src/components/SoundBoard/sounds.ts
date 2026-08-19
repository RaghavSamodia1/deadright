import type { TileSize } from '../BentoTile/BentoTile';

/**
 * The soundboard's roster.
 *
 * Every clip here is synthesised from oscillators and noise rather than
 * sampled, so nothing in this repo is somebody else's recording — which matters
 * for a public repo, and meant each one could be cut to length for a phone
 * speaker instead of being found and trimmed.
 */
export interface Pad {
  key: string;
  /** What it says on the pad. */
  label: string;
  /** The line underneath — the joke, not a description. */
  caption: string;
  /** Wash colour for the pad's glass. */
  hue: string;
  /** Ink for the label. Pads carry no status, so the colour is free. */
  ink: string;
  /** How hard it kicks back. An airhorn should not feel like crickets. */
  weight: 'light' | 'medium' | 'heavy';
  size: TileSize;
  module: number;
}

// Grouped in the order they sit on the grid, so the file reads like the board.
export const PADS: Pad[] = [
  {
    key: 'airhorn', label: 'AIRHORN', caption: 'BRRRAAAP',
    hue: 'rgba(226,102,31,0.30)', ink: '#FFC49A', weight: 'heavy',
    size: 'hero', module: require('../../../assets/sfx/airhorn.wav'),
  },
  {
    key: 'boom', label: 'BOOM', caption: 'bass',
    hue: 'rgba(108,99,255,0.30)', ink: '#C4C0FF', weight: 'heavy',
    size: 'stat', module: require('../../../assets/sfx/boom.wav'),
  },
  {
    key: 'badumtss', label: 'BA-DUM', caption: 'tss',
    hue: 'rgba(247,200,70,0.26)', ink: '#FFD966', weight: 'medium',
    size: 'stat', module: require('../../../assets/sfx/badumtss.wav'),
  },
  {
    key: 'drumroll', label: 'DRUM ROLL', caption: 'and the winner is',
    hue: 'rgba(79,168,160,0.30)', ink: '#9FE4DC', weight: 'medium',
    size: 'feature', module: require('../../../assets/sfx/drumroll.wav'),
  },
  {
    key: 'kaching', label: 'KA-CHING', caption: 'pay up',
    hue: 'rgba(99,185,114,0.30)', ink: '#A8EEB6', weight: 'light',
    size: 'nav', module: require('../../../assets/sfx/kaching.wav'),
  },
  {
    key: 'buzzer', label: 'WRONG', caption: 'nope',
    hue: 'rgba(252,87,78,0.30)', ink: '#FFA9A4', weight: 'heavy',
    size: 'nav', module: require('../../../assets/sfx/buzzer.wav'),
  },
  {
    key: 'crickets', label: 'CRICKETS', caption: 'anyone?',
    hue: 'rgba(255,255,255,0.10)', ink: '#C9C9D0', weight: 'light',
    size: 'stat', module: require('../../../assets/sfx/crickets.wav'),
  },
  {
    key: 'trombone', label: 'SAD TROMBONE', caption: 'womp womp',
    hue: 'rgba(232,179,60,0.26)', ink: '#F5CE72', weight: 'medium',
    size: 'band', module: require('../../../assets/sfx/trombone.wav'),
  },
  {
    key: 'suspense', label: 'SUSPENSE', caption: 'dun dun DUNNN',
    hue: 'rgba(108,99,255,0.26)', ink: '#C4C0FF', weight: 'medium',
    size: 'half', module: require('../../../assets/sfx/suspense.wav'),
  },
  {
    key: 'tada', label: 'TA-DA', caption: 'called it',
    hue: 'rgba(226,102,31,0.26)', ink: '#FFC49A', weight: 'medium',
    size: 'half', module: require('../../../assets/sfx/tada.wav'),
  },
];
