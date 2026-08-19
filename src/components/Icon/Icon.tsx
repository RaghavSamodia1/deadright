import React from 'react';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';

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
  | 'arrow'
  | 'back'
  | 'more'
  | 'dice'
  | 'person'
  | 'lock'
  | 'ban'
  | 'camera'
  | 'image'
  | 'rules'
  | 'target'
  | 'chart'
  | 'coin'
  | 'megaphone'
  | 'gear'
  | 'check'
  | 'cross'
  | 'external'
  | 'halo'
  | 'shrug'
  | 'ladder'
  | 'inbox'
  | 'refresh'
  | 'moon'
  | 'heart'
  | 'share'
  | 'doc'
  | 'info'
  | 'exit'
  | 'waveform'
  // Soundboard: the pads name a noise, not a destination, so they needed
  // their own small set rather than the nearest functional icon.
  | 'burst'
  | 'cymbal'
  | 'drum'
  | 'horn'
  | 'bolt'
  | 'trash';

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
      {name === 'back' && <Path d="M20 12H5M12 5l-7 7 7 7" {...stroke} />}
      {name === 'dice' && (
        <>
          <Path d="M4 8.5v7l8 4.5 8-4.5v-7L12 4 4 8.5Z" {...stroke} />
          <Circle cx="9" cy="10" r="1.1" fill={color} />
          <Circle cx="15" cy="12.6" r="1.1" fill={color} />
        </>
      )}
      {name === 'more' && (
        <>
          <Circle cx="5" cy="12" r="1.6" fill={color} />
          <Circle cx="12" cy="12" r="1.6" fill={color} />
          <Circle cx="19" cy="12" r="1.6" fill={color} />
        </>
      )}
      {name === 'refresh' && (
        <>
          <Path d="M21 12a9 9 0 1 1-3-6.7" {...stroke} />
          <Path d="M21 4v5h-5" {...stroke} />
        </>
      )}
      {name === 'moon' && <Path d="M20 14A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20 14z" {...stroke} />}
      {name === 'heart' && (
        <Path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9z" {...stroke} />
      )}
      {name === 'share' && (
        <>
          <Path d="M12 15V3M8 7l4-4 4 4" {...stroke} />
          <Path d="M5 13v7h14v-7" {...stroke} />
        </>
      )}
      {name === 'doc' && (
        <>
          <Path d="M6 3h9l4 4v14H6V3z" {...stroke} />
          <Path d="M15 3v4h4" {...stroke} />
        </>
      )}
      {name === 'info' && (
        <>
          <Circle cx="12" cy="12" r="9" {...stroke} />
          <Path d="M12 11v5" {...stroke} />
          <Circle cx="12" cy="7.75" r="1" fill={color} />
        </>
      )}
      {name === 'exit' && (
        <>
          <Path d="M14 4H5v16h9" {...stroke} />
          <Path d="M18 12H9M15 8l4 4-4 4" {...stroke} />
        </>
      )}
      {/* Five bars at a mixed height — a level meter rather than a speaker.
          `megaphone` is already the broadcast icon; this one has to say "noise
          you can play with", so it borrows the shape of a mixing desk. */}
      {name === 'waveform' && (
        <>
          <Path d="M4 10v4M8 6v12M12 3v18M16 7v10M20 11v2" {...stroke} />
        </>
      )}
      {/* An eight-point star, not rays off a circle — the same distinction the
          gear note makes below. Rays read as a sun; a jagged outline reads as
          something going off. */}
      {name === 'burst' && (
        <Path
          d="M12 2.6l2.2 4.6 4.9-1.6-1.6 4.9 4.6 2.2-4.6 2.2 1.6 4.9-4.9-1.6L12 21.4l-2.2-4.6-4.9 1.6 1.6-4.9L1.9 12l4.6-2.2-1.6-4.9 4.9 1.6z"
          {...stroke}
        />
      )}
      {name === 'cymbal' && (
        <>
          <Ellipse cx="12" cy="8.5" rx="9" ry="2.8" {...stroke} />
          <Path d="M12 11.3V20M9 20h6" {...stroke} />
        </>
      )}
      {name === 'drum' && (
        <>
          <Ellipse cx="12" cy="7.5" rx="8" ry="3" {...stroke} />
          <Path d="M4 7.5v8c0 1.7 3.6 3 8 3s8-1.3 8-3v-8" {...stroke} />
          {/* Tension rods. At 18px they are texture rather than detail, which
              is the point — they stop the body reading as a bucket. */}
          <Path d="M7.2 10.6l2.4 4.6M16.8 10.6l-2.4 4.6" {...stroke} />
        </>
      )}
      {/* A trombone rather than another cone: the slide on the left is what
          stops it being the megaphone again. */}
      {name === 'horn' && (
        <>
          <Path d="M14 10.5v3l7 3.5V7z" {...stroke} />
          <Path d="M14 12H6M6 9.5v5" {...stroke} />
        </>
      )}
      {name === 'bolt' && (
        <Path d="M13 2.5L5 13.5h5.5L10 21.5 19 10h-5.5z" {...stroke} />
      )}
      {name === 'trash' && (
        <>
          <Path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" {...stroke} />
        </>
      )}
      {name === 'person' && (
        <>
          <Circle cx="12" cy="8" r="4" {...stroke} />
          <Path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" {...stroke} />
        </>
      )}
      {name === 'lock' && (
        <>
          <Path d="M5 11h14v10H5V11z" {...stroke} />
          <Path d="M8 11V7a4 4 0 0 1 8 0v4" {...stroke} />
        </>
      )}
      {name === 'ban' && (
        <>
          <Circle cx="12" cy="12" r="9" {...stroke} />
          <Path d="M5.6 5.6l12.8 12.8" {...stroke} />
        </>
      )}
      {name === 'camera' && (
        <>
          <Path d="M3 8h4l2-3h6l2 3h4v12H3V8z" {...stroke} />
          <Circle cx="12" cy="13" r="4" {...stroke} />
        </>
      )}
      {name === 'image' && (
        <>
          <Path d="M3 5h18v14H3V5z" {...stroke} />
          <Circle cx="8.5" cy="10" r="1.5" {...stroke} />
          <Path d="M21 16l-5-5-8 8" {...stroke} />
        </>
      )}
      {name === 'rules' && (
        <>
          <Path d="M6 3h9l4 4v14H6V3z" {...stroke} />
          <Path d="M15 3v4h4M9 12h6M9 16h6" {...stroke} />
        </>
      )}
      {name === 'target' && (
        <>
          <Circle cx="12" cy="12" r="9" {...stroke} />
          <Circle cx="12" cy="12" r="4" {...stroke} />
          <Circle cx="12" cy="12" r="1" fill={color} />
        </>
      )}
      {name === 'chart' && (
        <>
          <Path d="M4 20V10M10 20V4M16 20v-7M22 20H2" {...stroke} />
        </>
      )}
      {name === 'coin' && (
        <>
          <Circle cx="12" cy="12" r="9" {...stroke} />
          <Path d="M12 7v10M9.5 9.5h4a2 2 0 0 1 0 4h-3a2 2 0 0 0 0 4h4" {...stroke} />
        </>
      )}
      {name === 'megaphone' && (
        <>
          <Path d="M3 11v2a1 1 0 0 0 1 1h3l7 4V6L7 10H4a1 1 0 0 0-1 1z" {...stroke} />
          <Path d="M18 9a4 4 0 0 1 0 6" {...stroke} />
        </>
      )}
      {/* Thin rays radiating off a small circle is a sun, which is what this
          drew before. A cog's teeth are stubby and touch the rim. */}
      {name === 'gear' && (
        <>
          <Circle cx="12" cy="12" r="7" {...stroke} />
          <Circle cx="12" cy="12" r="2.6" {...stroke} />
          <Path
            d="M12 3.2v2M12 18.8v2M3.2 12h2M18.8 12h2M5.8 5.8l1.4 1.4M16.8 16.8l1.4 1.4M18.2 5.8l-1.4 1.4M7.2 16.8l-1.4 1.4"
            stroke={color}
            strokeWidth={2.6}
            strokeLinecap="butt"
          />
        </>
      )}
      {name === 'check' && <Path d="M4 12.5l5 5L20 6.5" {...stroke} />}
      {name === 'cross' && <Path d="M6 6l12 12M18 6L6 18" {...stroke} />}
      {name === 'external' && (
        <>
          <Path d="M13 4h7v7" {...stroke} />
          <Path d="M20 4l-9 9M19 14v6H4V5h6" {...stroke} />
        </>
      )}
      {name === 'halo' && (
        <>
          <Circle cx="12" cy="13" r="6" {...stroke} />
          <Path d="M7 5.5a10 10 0 0 1 10 0" {...stroke} />
        </>
      )}
      {name === 'shrug' && (
        <>
          <Circle cx="12" cy="8" r="3.5" {...stroke} />
          <Path d="M5 20c0-3 2-5 4-5M19 20c0-3-2-5-4-5M3 14l2-2M21 14l-2-2" {...stroke} />
        </>
      )}
      {name === 'ladder' && (
        <>
          <Path d="M7 3v18M17 3v18M7 8h10M7 13h10M7 18h10" {...stroke} />
        </>
      )}
      {name === 'inbox' && (
        <>
          <Path d="M3 13h5l1.5 3h5L16 13h5" {...stroke} />
          <Path d="M5 5h14l2 8v6H3v-6l2-8z" {...stroke} />
        </>
      )}
      {name === 'arrow' && <Path d="M4 12h15M13 6l6 6-6 6" {...stroke} />}
    </Svg>
  );
}
