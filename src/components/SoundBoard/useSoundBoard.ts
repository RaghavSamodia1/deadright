import { useEffect, useRef, useState } from 'react';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { PADS } from './sounds';

/**
 * Loads the board's clips while it's open and throws them away when it isn't.
 *
 * The clips are preloaded rather than opened on tap because latency is the
 * whole thing: a pad that answers 200ms later isn't an instrument, it's a
 * download. They're uncompressed WAV for the same reason — 1.5MB inside an 85MB
 * APK buys a decode step that never happens.
 *
 * Sounds overlap freely; tapping the *same* pad restarts it. That's what makes
 * it fun to hammer, and it also caps how many voices one pad can stack up.
 */
export function useSoundBoard(active: boolean) {
  const sounds = useRef<Record<string, Audio.Sound>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    (async () => {
      // Scoped to the board being open, and put back on the way out.
      //
      // playsInSilentModeIOS overrides the mute switch, which is normally rude
      // — but this is a screen you opened to make noise on, and respecting the
      // switch here means tapping ten pads and hearing nothing, which reads as
      // broken rather than as considerate. It's set only while the board is up.
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      });

      const loaded = await Promise.all(
        PADS.map(async (p) => {
          const { sound } = await Audio.Sound.createAsync(p.module, { shouldPlay: false });
          return [p.key, sound] as const;
        }),
      );

      if (cancelled) {
        loaded.forEach(([, s]) => s.unloadAsync().catch(() => {}));
        return;
      }
      const map: Record<string, Audio.Sound> = {};
      loaded.forEach(([k, s]) => { map[k] = s; });
      sounds.current = map;
      setReady(true);
    })().catch(() => {
      // A board that can't load audio is a quiet bento, not a crash. The pads
      // still animate and still give haptics.
    });

    return () => {
      cancelled = true;
      setReady(false);
      const open = sounds.current;
      sounds.current = {};
      Object.keys(open).forEach((k) => { open[k].unloadAsync().catch(() => {}); });
      Audio.setAudioModeAsync({
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      }).catch(() => {});
    };
  }, [active]);

  const play = (key: string) => {
    const s = sounds.current[key];
    if (!s) return;
    s.replayAsync().catch(() => {});
  };

  return { ready, play };
}
