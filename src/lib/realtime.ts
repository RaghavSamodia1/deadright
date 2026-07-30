/**
 * Realtime channel naming.
 *
 * `supabase.channel(name)` returns the *existing* channel when one of that name
 * is already in the client's registry — it does not create a second one. Two
 * subscribers wanting the same data therefore share one channel object, and the
 * second one's `.on('postgres_changes', …)` lands after the first's
 * `.subscribe()`, which throws:
 *
 *   cannot add `postgres_changes` callbacks for realtime:… after `subscribe()`
 *
 * That crashed the app on startup, because Home and Alerts are both mounted by
 * the tab navigator and both watch `notifications`. `removeChannel` is async,
 * so a fast unmount/remount hits the same trap.
 *
 * Giving every subscription its own channel name sidesteps it entirely. The
 * cost is one socket topic per subscriber rather than per topic, which is fine
 * at this scale and multiplexed over a single websocket anyway.
 */
let seq = 0;

export function uniqueChannelName(base: string): string {
  seq += 1;
  return `${base}#${seq}`;
}
