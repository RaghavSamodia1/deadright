import { supabase } from '../lib/supabase';
import type { SharpenResult } from '../types/database';

/**
 * AI Sharpen (§4b). Returns null on ANY failure or if slower than 2s —
 * the spec says fail silently, never block publishing on AI.
 */
export async function sharpen(
  text: string,
  type: 'prediction' | 'dare' | 'open',
): Promise<SharpenResult | null> {
  if (text.trim().length < 15) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);

  try {
    const { data, error } = await supabase.functions.invoke('sharpen', {
      body: { text, type, now: new Date().toISOString() },
      // supabase-js v2 passes fetch options through to the underlying fetch:
      signal: controller.signal,
    });
    if (error || !data || data.error) return null;
    return data as SharpenResult;
  } catch {
    return null; // aborted or network error → shimmer-then-disappear
  } finally {
    clearTimeout(timeout);
  }
}
