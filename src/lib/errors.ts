/**
 * Database exceptions reach the UI verbatim — the Resolve screen showed a bare
 * "not_participant" under the submit button. The RPCs raise short codes on
 * purpose (they are stable to match on); this is where they become sentences.
 *
 * Anything that isn't a known code passes through, because Supabase's auth
 * errors are already written for people ("Invalid login credentials"). Only
 * unrecognised snake_case — i.e. a code we forgot to map — falls back to the
 * generic line, so a missing entry reads as vague rather than as gibberish.
 */
const MESSAGES: Record<string, string> = {
  admin_only: 'Only a group admin can do that.',
  already_resolved: 'This bet has already been settled.',
  deadline_passed: 'The deadline for this one has passed.',
  dispute_window_closed: 'The 24 hours to dispute this have run out.',
  incomplete_ranking: 'Rank every option before you submit.',
  invalid_code: 'That code doesn’t match any group.',
  invalid_rule: 'That rule isn’t valid for this jar.',
  no_such_bet: 'That bet no longer exists.',
  not_allowed: 'You don’t have permission to do that.',
  not_an_ordinal_bet: 'That bet isn’t a ranking bet.',
  not_authenticated: 'You’ve been signed out. Sign in and try again.',
  not_member: 'You’re not a member of that group.',
  not_open: 'This is closed to new entries.',
  not_participant: 'You’re not in this bet, so you can’t resolve it.',
  not_cancellable: 'Only an open bet can be called off — this one has moved on.',
  not_resolvable: 'This bet can’t be resolved yet.',
  not_resolver: 'Only someone in this bet can resolve it.',
  nothing_to_agree: 'Nothing here is waiting on you.',
  own_up_is_self_only: 'You can only own up to your own violation.',
  sides_locked: 'Sides are locked on this bet.',
  undo_window_closed: 'Too late to undo that one.',
  unknown_option: 'That option isn’t part of this bet.',
  wrong_password:
    'That email already has an account, and this password doesn’t open it. Get in with a code instead.',
};

/** Looks like a raised code rather than prose: snake_case, no spaces. */
const IS_CODE = /^[a-z][a-z0-9_]*$/;

export function humanError(e: unknown): string {
  if (!e) return '';
  const raw =
    typeof e === 'string' ? e : ((e as any)?.message ?? String(e));
  const key = raw.trim();

  if (MESSAGES[key]) return MESSAGES[key];

  // Postgres surfaces unique violations as a wall of SQL. The only one a
  // person can act on here is a handle that's already taken.
  if (/duplicate key|23505/i.test(raw)) return 'That’s already taken.';
  if (/row-level security|violates row-level/i.test(raw)) {
    return 'You don’t have access to that.';
  }
  if (/network|fetch failed|Failed to fetch/i.test(raw)) {
    return 'No connection. Check your signal and try again.';
  }

  if (IS_CODE.test(key)) return 'Something went wrong. Try that again.';
  return raw;
}
