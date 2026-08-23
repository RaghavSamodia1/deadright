import type { BetCardData } from '../components';
import type { BetStatus } from '../components';
import { formatMoney } from './money';

/**
 * DB `bets` row (with embedded creator + participants) → the shape BetCard
 * renders. Kept in one place so Home, Feed, Profile and Group agree.
 */
export function toBetCard(
  b: any,
  myUserId?: string | null,
  currency?: string | null,
): BetCardData {
  const participants: any[] = b.participants ?? [];
  const sideA = participants.filter((p) => p.side === 'a').length;
  const sideB = participants.filter((p) => p.side === 'b').length;
  const total = sideA + sideB;
  const creator = b.creator ?? {};
  const name: string = creator.display_name ?? creator.handle ?? '';

  return {
    id: b.id,
    title: b.title,
    status: toBetStatus(b, myUserId),
    author: {
      handle: name || 'Someone',
      initials: (name || '??').slice(0, 2).toUpperCase(),
      avatarUri: creator.avatar_url ?? undefined,
    },
    group: b.group?.name ?? undefined,
    // The labels have been on the bets table since the first migration,
    // defaulting to YES and NO, and nothing had ever read them.
    sideALabel: b.side_a_label ?? 'YES',
    sideBLabel: b.side_b_label ?? 'NO',
    // A call bet has no sides — the A/B bar is replaced by the calls themselves.
    callKind: b.call_kind ?? undefined,
    callUnit: b.call_unit ?? undefined,
    calls: b.call_kind
      ? participants
          // Both null- and undefined-checked: a query that forgets to select
          // the columns hands back undefined, and String(undefined) printed the
          // literal word "undefined" on the detail screen where somebody's
          // answer should have been.
          .filter((p) => p.call_number != null || p.call_date != null)
          .map((p) => ({
            handle:
              p.profile?.display_name ?? p.profile?.handle ?? 'Someone',
            value:
              b.call_kind === 'number'
                ? String(p.call_number)
                : new Date(p.call_date).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                  }),
            isWinner: p.is_winner === true,
            isMe: !!myUserId && p.user_id === myUserId,
          }))
          .sort((x, y) => Number(y.isWinner) - Number(x.isWinner))
      : undefined,
    actual:
      b.actual_number !== null && b.actual_number !== undefined
        ? String(b.actual_number)
        : b.actual_date
          ? new Date(b.actual_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
          : undefined,
    sideAPercent: total > 0 ? Math.round((sideA / total) * 100) : 50,
    sideACount: sideA,
    sideBCount: sideB,
    participantCount: total,
    stake: formatStake(b, betCurrency(b, currency)),
    isOrdinal: b.type === 'ordinal',
    deadline: new Date(b.deadline),
    isCreator: b.is_creator ?? undefined,
  };
}

/**
 * bet_status enum → the visual status BetCard colours itself by. Most values
 * map 1:1; `resolved` splits into win/loss from my side, and `pending_agreement`
 * shows as awaiting (amber) since it still needs someone to act.
 * `myUserId` is optional — without it a resolved bet falls back to 'win'.
 */
function toBetStatus(b: any, myUserId?: string | null): BetStatus {
  switch (b.status) {
    case 'live':
      return 'live';
    case 'disputed':
      return 'disputed';
    case 'controversial':
      return 'controversial';
    case 'awaiting':
    case 'pending_agreement':
      return 'awaiting';
    case 'resolved': {
      const mySide =
        b.my_side ??
        (b.participants ?? []).find((p: any) => p.user_id === myUserId)?.side;
      // No side of mine means this one wasn't mine to win: I created it
      // without taking a side, or I'm a group member who only watched. This
      // used to fall through to 'win', so every resolved bet in the feed
      // congratulated whoever opened it.
      if (!mySide || !b.winning_side) return 'settled';
      return b.winning_side === mySide ? 'win' : 'loss';
    }
    // Fell through to 'active' here, so a called-off bet still displayed as
    // live and joinable.
    case 'cancelled':
      return 'cancelled';
    case 'active':
    default:
      return 'active';
  }
}

/**
 * A bet's unit comes from the bet, not from whoever is reading it: its group's
 * currency, or its own for a solo bet. Using the viewer's setting made a stake
 * read ₹10 on the bet screen while the ledger entry it produced said £10 — the
 * group's actual unit. `fallback` only covers a bet whose group didn't load.
 */
export function betCurrency(b: any, fallback?: string | null): string | undefined {
  return b?.group?.currency ?? b?.currency ?? fallback ?? undefined;
}

function formatStake(b: any, currency?: string | null): string | undefined {
  // dare_forfeit already carries its own emoji ("🏆 Bragging rights"), and it is
  // the whole point of the stake — returning a bare 🎲 threw it away and every
  // non-money bet looked identical.
  if (b.stake_kind === 'dare') return b.dare_forfeit || undefined;
  if (b.stake_kind === 'secret') return '🤐';
  // toFixed(0) rounded a custom £12.50 stake to "£13" — formatMoney keeps the
  // decimals when there are any and drops them when there aren't.
  // Without the currency this fell back to GBP, so a stake printed "£12.50" on
  // a screen whose every other figure was the user's own currency.
  if (b.stake_amount_cents) return formatMoney(b.stake_amount_cents, currency);
  return undefined;
}
