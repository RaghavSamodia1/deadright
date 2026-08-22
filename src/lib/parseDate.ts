/**
 * Reading a deadline out of the way people actually write bets.
 *
 * "Goa trip by October end", "Arnav will get a job by oct", "he's late again
 * tomorrow" — the date is nearly always already in the sentence, and making
 * someone pick it a second time on the next screen is asking them to repeat
 * themselves. This finds it so the Deadline step can arrive pre-answered.
 *
 * Two rules the whole file is built around:
 *
 * 1. A deadline is always in the future. "by October" in November means next
 *    October, not one that has already gone.
 * 2. Never guess. A wrong date that looks confident is worse than no date at
 *    all, so anything ambiguous returns null and the user picks. That is why
 *    `matched` comes back with the date — the screen shows the words it read,
 *    so a bad reading is visible rather than silent.
 */

export interface FoundDate {
  /** End of day, local time — the same convention the date picker uses. */
  date: Date;
  /** The exact substring that produced it, shown back to the user. */
  matched: string;
}

const MONTHS = [
  ['january', 'jan'],
  ['february', 'feb'],
  ['march', 'mar'],
  ['april', 'apr'],
  ['may'],
  ['june', 'jun'],
  ['july', 'jul'],
  ['august', 'aug'],
  ['september', 'sep', 'sept'],
  ['october', 'oct'],
  ['november', 'nov'],
  ['december', 'dec'],
];

const WEEKDAYS = [
  ['sunday', 'sun'],
  ['monday', 'mon'],
  ['tuesday', 'tue', 'tues'],
  ['wednesday', 'wed'],
  ['thursday', 'thu', 'thurs'],
  ['friday', 'fri'],
  ['saturday', 'sat'],
];

/**
 * Words that mark what follows as a time, not a noun.
 *
 * These exist because English months and weekdays double as ordinary words.
 * "he may get a job" is not May, "we sat down" is not Saturday, and "march on"
 * is not March. A bare month or a short weekday only counts when one of these
 * is in front of it; a day number does the same job when there is one.
 */
const CUE = '(?:by|before|until|til|till|due|on|in|during|around|end of|ending)';

const MONTH_ALT = MONTHS.flat().join('|');
const WEEKDAY_FULL = WEEKDAYS.map((w) => w[0]).join('|');
const WEEKDAY_ALT = WEEKDAYS.flat().join('|');

function monthIndex(word: string): number {
  const w = word.toLowerCase();
  return MONTHS.findIndex((names) => names.indexOf(w) !== -1);
}
function weekdayIndex(word: string): number {
  const w = word.toLowerCase();
  return WEEKDAYS.findIndex((names) => names.indexOf(w) !== -1);
}

/** 23:59 on the given day, local time. */
function endOfDay(y: number, m: number, d: number): Date {
  return new Date(y, m, d, 23, 59, 0, 0);
}
function endOfMonth(y: number, m: number): Date {
  // Day 0 of the next month is the last day of this one, leap years included.
  return new Date(y, m + 1, 0, 23, 59, 0, 0);
}
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 23, 59, 0, 0);
}

type Rule = {
  re: RegExp;
  run: (m: RegExpMatchArray, now: Date) => Date | null;
};

/**
 * Ordered by specificity, and the order is load-bearing: "end of October" has
 * to be tried before "October", and "next week" before a bare weekday.
 */
const RULES: Rule[] = [
  // ── Relative counts ──────────────────────────────────────────────────────
  {
    re: new RegExp(`\\bin\\s+(a|an|one|\\d{1,3})\\s+(day|week|month|year)s?\\b`, 'i'),
    run: (m, now) => {
      const n = /^\d+$/.test(m[1]) ? parseInt(m[1], 10) : 1;
      if (n < 1 || n > 365) return null;
      const unit = m[2].toLowerCase();
      if (unit === 'day') return addDays(now, n);
      if (unit === 'week') return addDays(now, n * 7);
      if (unit === 'month') {
        const d = new Date(now.getFullYear(), now.getMonth() + n, now.getDate());
        return endOfDay(d.getFullYear(), d.getMonth(), d.getDate());
      }
      return endOfDay(now.getFullYear() + n, now.getMonth(), now.getDate());
    },
  },

  // ── Named days ───────────────────────────────────────────────────────────
  {
    re: /\b(day after tomorrow)\b/i,
    run: (_m, now) => addDays(now, 2),
  },
  {
    re: /\b(tomorrow|tmrw|tmw|tomo)\b/i,
    run: (_m, now) => addDays(now, 1),
  },
  {
    re: /\b(today|tonight|end of (?:the )?day|eod)\b/i,
    run: (_m, now) => addDays(now, 0),
  },
  {
    re: /\b(this weekend|the weekend)\b/i,
    // Saturday. "The weekend" as a deadline means the whole thing is over by
    // Sunday night, but people mean the weekend that is coming, so Saturday is
    // the honest read of when it starts to be true.
    run: (_m, now) => {
      const delta = (6 - now.getDay() + 7) % 7 || 7;
      return addDays(now, delta);
    },
  },

  // ── End of period ────────────────────────────────────────────────────────
  {
    re: /\bend of (?:the )?week\b|\bweek[- ]end\b/i,
    run: (_m, now) => {
      const delta = (0 - now.getDay() + 7) % 7 || 7; // upcoming Sunday
      return addDays(now, delta);
    },
  },
  {
    re: /\bend of (?:the )?month\b|\bmonth[- ]end\b/i,
    run: (_m, now) => endOfMonth(now.getFullYear(), now.getMonth()),
  },
  {
    re: /\bend of (?:the )?year\b|\byear[- ]end\b/i,
    run: (_m, now) => endOfDay(now.getFullYear(), 11, 31),
  },

  // ── Next period ──────────────────────────────────────────────────────────
  {
    re: /\bnext week\b/i,
    run: (_m, now) => addDays(now, 7),
  },
  {
    re: /\bnext month\b/i,
    run: (_m, now) => endOfMonth(now.getFullYear(), now.getMonth() + 1),
  },
  {
    re: /\bnext year\b/i,
    run: (_m, now) => endOfDay(now.getFullYear() + 1, 11, 31),
  },

  // ── Month with a day number ──────────────────────────────────────────────
  // "15 Oct", "15th October", "Oct 15", "October 15th". A number next to a
  // month is unambiguous enough not to need a cue word in front of it.
  {
    re: new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${MONTH_ALT})\\b`, 'i'),
    run: (m, now) => dayInMonth(parseInt(m[1], 10), monthIndex(m[2]), now),
  },
  {
    re: new RegExp(`\\b(${MONTH_ALT})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i'),
    run: (m, now) => dayInMonth(parseInt(m[2], 10), monthIndex(m[1]), now),
  },

  // ── End of a named month ─────────────────────────────────────────────────
  {
    re: new RegExp(`\\bend of (${MONTH_ALT})\\b`, 'i'),
    run: (m, now) => monthEndFuture(monthIndex(m[1]), now),
  },
  {
    re: new RegExp(`\\b(${MONTH_ALT})[- ]end\\b`, 'i'),
    run: (m, now) => monthEndFuture(monthIndex(m[1]), now),
  },

  // ── Weekdays ─────────────────────────────────────────────────────────────
  {
    re: new RegExp(`\\bnext\\s+(${WEEKDAY_ALT})\\b`, 'i'),
    run: (m, now) => nextWeekday(weekdayIndex(m[1]), now, true),
  },
  {
    re: new RegExp(`\\b${CUE}\\s+(?:this\\s+)?(${WEEKDAY_ALT})\\b`, 'i'),
    run: (m, now) => nextWeekday(weekdayIndex(m[1]), now, false),
  },
  {
    // Bare, full spelling only: "sat", "wed" and "sun" are all ordinary words.
    re: new RegExp(`\\b(${WEEKDAY_FULL})\\b`, 'i'),
    run: (m, now) => nextWeekday(weekdayIndex(m[1]), now, false),
  },

  // ── Numeric ──────────────────────────────────────────────────────────────
  {
    re: /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/,
    run: (m) => {
      const y = +m[1], mo = +m[2] - 1, d = +m[3];
      return valid(y, mo, d) ? endOfDay(y, mo, d) : null;
    },
  },
  {
    re: /\b(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?\b/,
    run: (m, now) => {
      let a = +m[1], b = +m[2];
      // Day-first: the app's money is in ₹ and £, so its users write 15/10.
      // If the first number cannot be a month it settles itself either way.
      let d = a, mo = b - 1;
      if (a > 12 && b <= 12) { d = a; mo = b - 1; }
      else if (b > 12 && a <= 12) { d = b; mo = a - 1; }
      let y: number;
      if (m[3]) {
        y = +m[3];
        if (y < 100) y += 2000;
      } else {
        y = now.getFullYear();
      }
      if (!valid(y, mo, d)) return null;
      let out = endOfDay(y, mo, d);
      if (!m[3] && out.getTime() <= now.getTime()) out = endOfDay(y + 1, mo, d);
      return out;
    },
  },

  // ── Bare month, last of all ──────────────────────────────────────────────
  // Needs a cue in front of it, which is what keeps "he may get a job" and
  // "march on" out. A month on its own means the end of that month: "by
  // October" is not a promise about the 1st.
  {
    re: new RegExp(`\\b${CUE}\\s+(?:the\\s+)?(${MONTH_ALT})\\b`, 'i'),
    run: (m, now) => monthEndFuture(monthIndex(m[1]), now),
  },
];

function valid(y: number, m: number, d: number): boolean {
  if (m < 0 || m > 11 || d < 1 || d > 31) return false;
  if (y < 1970 || y > 2200) return false;
  const probe = new Date(y, m, d);
  return probe.getMonth() === m && probe.getDate() === d;
}

/** A day in a named month, rolled to next year if it has already gone. */
function dayInMonth(day: number, month: number, now: Date): Date | null {
  if (month < 0 || !valid(now.getFullYear(), month, day)) return null;
  let out = endOfDay(now.getFullYear(), month, day);
  if (out.getTime() <= now.getTime()) out = endOfDay(now.getFullYear() + 1, month, day);
  return valid(out.getFullYear(), out.getMonth(), out.getDate()) ? out : null;
}

/** The end of a named month, rolled to next year if it has already gone. */
function monthEndFuture(month: number, now: Date): Date | null {
  if (month < 0) return null;
  let out = endOfMonth(now.getFullYear(), month);
  if (out.getTime() <= now.getTime()) out = endOfMonth(now.getFullYear() + 1, month);
  return out;
}

/**
 * The next time that weekday comes round.
 *
 * "by Friday" on a Friday means today — the day has not run out yet. "next
 * Friday" always means the one after this week's, which is what people mean
 * even when it is strictly the same day.
 */
function nextWeekday(target: number, now: Date, forceNextWeek: boolean): Date | null {
  if (target < 0) return null;
  let delta = (target - now.getDay() + 7) % 7;
  if (forceNextWeek) delta = delta === 0 ? 7 : delta + 7;
  return addDays(now, delta);
}

/**
 * The first date-shaped thing in the text, or null.
 *
 * Every rule is tried and the one that matches *earliest in the string* wins,
 * with rule order breaking ties. Scanning by position rather than taking the
 * first rule that hits anywhere stops a throwaway "next week" at the end of a
 * sentence beating the "15 Oct" at the start of it.
 */
export function findDeadline(text: string, now: Date = new Date()): FoundDate | null {
  if (!text || text.trim().length < 3) return null;

  let best: { at: number; order: number; found: FoundDate } | null = null;

  for (let i = 0; i < RULES.length; i++) {
    const m = text.match(RULES[i].re);
    if (!m || m.index === undefined) continue;
    const date = RULES[i].run(m, now);
    if (!date || isNaN(date.getTime())) continue;
    // Only ever forward. A deadline that has already passed is not a deadline.
    if (date.getTime() <= now.getTime()) continue;

    if (!best || m.index < best.at) {
      best = { at: m.index, order: i, found: { date, matched: m[0].trim() } };
    }
  }

  return best ? best.found : null;
}

/** "Fri 31 Oct" — short enough for a chip, unambiguous about the day. */
export function shortDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(d.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}),
  });
}
