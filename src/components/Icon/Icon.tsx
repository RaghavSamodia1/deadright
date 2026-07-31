import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

/**
 * Line icons, drawn rather than borrowed from the emoji table.
 *
 * Emoji were standing in for an icon set across the whole app. They render at
 * the mercy of the platform's emoji font, can't take the surrounding ink
 * colour, sit on their own baseline, and read as placeholder art — the single
 * clearest sign that nobody drew the interface. These are on a 24 grid with a
 * 2px stroke so they align with the text next to them and inherit its colour.
 *
 * Emoji still earn their place where the *content* is expressive rather than
 * functional: the win stamp, a jar rule someone picked, a group's own avatar.
 */
export type IconName =
  | 'jar'
  | 'party'
  | 'ledger'
  | 'plus'
  | 'link'
  | 'users'
  | 'bell'
  | 'trophy'
  | 'flame'
  | 'clock'
  | 'scales'
  | 'search'
  | 'chevron'
  | 'arrow';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  /** Stroke weight; nudge up for large sizes so the icon keeps its presence. */
  strokeWidth?: number;
}

export function Icon({ name, size = 24, color = '#F0F0F0', strokeWidth = 2 }: IconProps) {
  const stroke = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'jar' && (
        <>
          <Path d="M6 8h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8z" {...stroke} />
          <Path d="M8 8V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3" {...stroke} />
          <Circle cx="10.5" cy="14" r="1" fill={color} />
          <Circle cx="14" cy="17" r="1" fill={color} />
        </>
      )}
      {name === 'party' && (
        <>
          <Path d="M3 21l5-13 8 8-13 5z" {...stroke} />
          <Path d="M14 5.5c1.5-1.5 3.5-1 4.5 0" {...stroke} />
          <Path d="M18 10c1.5-1.5 3-1 3.5 0" {...stroke} />
          <Path d="M13 2v2M20 4l-1 1M22 8h-2" {...stroke} />
        </>
      )}
      {name === 'ledger' && (
        <>
          <Path d="M22 7l-8.5 8.5-4-4L2 19" {...stroke} />
          <Path d="M16 7h6v6" {...stroke} />
        </>
      )}
      {name === 'plus' && <Path d="M12 5v14M5 12h14" {...stroke} />}
      {name === 'link' && (
        <>
          <Path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" {...stroke} />
          <Path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" {...stroke} />
        </>
      )}
      {name === 'users' && (
        <>
          <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" {...stroke} />
          <Circle cx="9" cy="7" r="4" {...stroke} />
          <Path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" {...stroke} />
        </>
      )}
      {name === 'bell' && (
        <>
          <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" {...stroke} />
          <Path d="M13.7 21a2 2 0 0 1-3.4 0" {...stroke} />
        </>
      )}
      {name === 'trophy' && (
        <>
          <Path d="M8 4h8v6a4 4 0 0 1-8 0V4z" {...stroke} />
          <Path d="M8 6H5a3 3 0 0 0 3 3M16 6h3a3 3 0 0 1-3 3" {...stroke} />
          <Path d="M12 14v4M9 21h6" {...stroke} />
        </>
      )}
      {name === 'flame' && (
        <Path
          d="M12 2c.5 3 2 4.5 3.5 6S18 11.5 18 14a6 6 0 0 1-12 0c0-1.5.6-2.8 1.5-3.7A2.5 2.5 0 0 0 10 13c1.4 0 2-1 2-2.5C12 9 11 8 11 6.5S11.5 3.5 12 2z"
          {...stroke}
        />
      )}
      {name === 'clock' && (
        <>
          <Circle cx="12" cy="12" r="9" {...stroke} />
          <Path d="M12 7v5l3.5 2" {...stroke} />
        </>
      )}
      {name === 'scales' && (
        <>
          <Path d="M12 3v18M7 21h10M4 8l8-2 8 2" {...stroke} />
          <Path d="M4 8l-2 5a3 3 0 0 0 4 0L4 8zM20 8l-2 5a3 3 0 0 0 4 0L20 8z" {...stroke} />
        </>
      )}
      {name === 'search' && (
        <>
          <Circle cx="11" cy="11" r="7" {...stroke} />
          <Path d="M20 20l-3.8-3.8" {...stroke} />
        </>
      )}
      {name === 'chevron' && <Path d="M9 5l7 7-7 7" {...stroke} />}
      {name === 'arrow' && <Path d="M4 12h15M13 6l6 6-6 6" {...stroke} />}
    </Svg>
  );
}
