import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

/**
 * Filled marks, as opposed to the line icons in components/Icon.
 *
 * Icon is chrome: 24-grid, 2px stroke, takes the ink colour of the text beside
 * it. These are the opposite — objects rather than symbols, drawn to sit on a
 * light face and be looked at. They exist for the slot reels, where a stroked
 * outline icon would read as a diagram of a cherry rather than a cherry.
 *
 * Every one is on a 100 grid with an explicit outline, so they hold together at
 * reel size (~44pt) and still look drawn at hero size.
 */
export type EmblemName =
  | 'seven'
  | 'cherry'
  | 'bell'
  | 'bar'
  | 'star'
  | 'horseshoe'
  | 'gem'
  | 'chip'
  | 'spade'
  | 'heart'
  | 'club'
  | 'coin';

interface EmblemProps {
  name: EmblemName;
  size?: number;
  /** Fill. The outline stays dark so the mark holds on a light reel face. */
  color?: string;
  outline?: string;
  /** Second fill, where a mark has two parts (the chip's edge dashes). */
  accent?: string;
}

export function Emblem({
  name,
  size = 44,
  color = '#F7C846',
  outline = '#0A0A0B',
  accent = '#F0F0F0',
}: EmblemProps) {
  const line = { stroke: outline, strokeWidth: 5, strokeLinejoin: 'round' as const };

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {name === 'seven' && (
        <Path d="M24 16h52L46 92H26l28-60H24z" fill={color} {...line} />
      )}

      {name === 'cherry' && (
        <>
          <Path
            d="M52 14c-6 18-22 26-26 40"
            fill="none"
            stroke={outline}
            strokeWidth={5}
            strokeLinecap="round"
          />
          <Path
            d="M52 14c8 16 20 22 26 34"
            fill="none"
            stroke={outline}
            strokeWidth={5}
            strokeLinecap="round"
          />
          <Circle cx="26" cy="72" r="18" fill={color} {...line} />
          <Circle cx="76" cy="66" r="16" fill={color} {...line} />
        </>
      )}

      {name === 'bell' && (
        <>
          <Path
            d="M50 10a8 8 0 0 1 8 8v2a26 26 0 0 1 18 25v20l8 11H16l8-11V45a26 26 0 0 1 18-25v-2a8 8 0 0 1 8-8z"
            fill={color}
            {...line}
          />
          <Path
            d="M40 84a10 10 0 0 0 20 0"
            fill="none"
            stroke={outline}
            strokeWidth={5}
            strokeLinecap="round"
          />
        </>
      )}

      {name === 'bar' && (
        <>
          <Rect x="10" y="34" width="80" height="32" rx="8" fill={color} {...line} />
          <Path
            d="M28 42v16M50 42v16M72 42v16"
            stroke={outline}
            strokeWidth={5}
            strokeLinecap="round"
          />
        </>
      )}

      {name === 'star' && (
        <Path d="m50 8 12 26 28 4-20 20 5 28-25-13-25 13 5-28L10 38l28-4z" fill={color} {...line} />
      )}

      {/* Caulks and nail holes. A bare arch reads as the letter n. */}
      {name === 'horseshoe' && (
        <>
          <Path
            d="M30 86V56a20 20 0 0 1 40 0v30"
            fill="none"
            stroke={color}
            strokeWidth={20}
          />
          <Path d="M30 86V56a20 20 0 0 1 40 0v30" fill="none" stroke={outline} strokeWidth={5} />
          <G fill={outline}>
            <Circle cx="30" cy="70" r="3.4" />
            <Circle cx="70" cy="70" r="3.4" />
            <Circle cx="36" cy="52" r="3.4" />
            <Circle cx="64" cy="52" r="3.4" />
          </G>
          <Rect x="20" y="82" width="20" height="9" rx="3" fill={color} stroke={outline} strokeWidth={4} />
          <Rect x="60" y="82" width="20" height="9" rx="3" fill={color} stroke={outline} strokeWidth={4} />
        </>
      )}

      {name === 'gem' && <Path d="M50 6 84 50 50 94 16 50z" fill={color} {...line} />}

      {name === 'chip' && (
        <>
          <Circle cx="50" cy="50" r="46" fill={color} stroke={outline} strokeWidth={6} />
          <G fill={accent}>
            <Rect x="44" y="2" width="12" height="16" rx="2" />
            <Rect x="44" y="82" width="12" height="16" rx="2" />
            <Rect x="2" y="44" width="16" height="12" rx="2" />
            <Rect x="82" y="44" width="16" height="12" rx="2" />
          </G>
          <Circle cx="50" cy="50" r="30" fill="none" stroke={outline} strokeWidth={5} />
          <Circle cx="50" cy="50" r="22" fill={accent} stroke={outline} strokeWidth={4} />
        </>
      )}

      {name === 'spade' && (
        <Path
          d="M50 8C36 26 14 38 14 56a20 20 0 0 0 33 15l-6 21h18l-6-21a20 20 0 0 0 33-15C86 38 64 26 50 8z"
          fill={color}
          {...line}
        />
      )}

      {name === 'heart' && (
        <Path
          d="M50 88C24 68 10 54 10 38a22 22 0 0 1 40-12 22 22 0 0 1 40 12c0 16-14 30-40 50z"
          fill={color}
          {...line}
        />
      )}

      {name === 'club' && (
        <Path
          d="M50 8a19 19 0 0 0-14 32 19 19 0 1 0-8 34 19 19 0 0 0 16-9l-4 27h20l-4-27a19 19 0 0 0 16 9 19 19 0 1 0-8-34A19 19 0 0 0 50 8z"
          fill={color}
          {...line}
        />
      )}

      {name === 'coin' && (
        <>
          <Circle cx="50" cy="50" r="42" fill={color} stroke={outline} strokeWidth={6} />
          <Circle cx="50" cy="50" r="30" fill="none" stroke={outline} strokeWidth={4} />
          <Path
            d="M50 30v40M40 40h16a8 8 0 0 1 0 16h-12a8 8 0 0 0 0 16h16"
            fill="none"
            stroke={outline}
            strokeWidth={5}
            strokeLinecap="round"
          />
        </>
      )}
    </Svg>
  );
}
