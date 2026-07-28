import type { BetCardData } from '../components';
import type { BetStatus } from '../components';

/**
 * DB `bets` row (with embedded creator + participants) → the shape BetCard
 * renders. Kept in one place so Home, Feed, Profile and Group agree.
 */
export function toBetCard(b: any, myUserId?: string | null): BetCardData {
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
      handle: creator.handle ? `@${creator.handle}` : '@someone',
      initials: (name || '??').slice(0, 2).toUpperCase(),
      avatarUri: creator.avatar_url ?? undefined,
    },
    group: b.group?.name ?? undefined,
    sideAPercent: total > 0 ? Math.round((sideA / total) * 100) : 50,
    sideACount: sideA,
    sideBCount: sideB,
    participantCount: total,
    stake: formatStake(b),
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
      if (!b.winning_side || !mySide) return 'win';
      return b.winning_side === mySide ? 'win' : 'loss';
    }
    case 'cancelled':
    case 'active':
    default:
      return 'active';
  }
}

function formatStake(b: any): string | undefined {
  if (b.stake_kind === 'dare') return b.dare_forfeit ? '🎲' : undefined;
  if (b.stake_kind === 'secret') return '🤐';
  if (b.stake_amount_cents) return `£${(b.stake_amount_cents / 100).toFixed(0)}`;
  return undefined;
}
