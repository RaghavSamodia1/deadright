// Row types matching supabase/migrations/00001_schema.sql
// Regenerate with `supabase gen types typescript` once the project is linked;
// until then these are the hand-maintained source of truth for the app.

export type BetType = 'prediction' | 'dare' | 'open' | 'ordinal';
export type StakeKind = 'money' | 'dare' | 'secret';
export type ResolutionMethod = 'mutual' | 'group_vote' | 'judge';
export type BetPrivacy = 'group' | 'link';
export type BetSide = 'a' | 'b';
export type BetStatus =
  | 'active'
  | 'live'
  | 'awaiting'
  | 'pending_agreement'
  | 'disputed'
  | 'resolved'
  | 'controversial'
  | 'cancelled';
export type MemberRole = 'member' | 'admin';
export type LedgerStatus = 'pending' | 'settled';
export type DisputeReason = 'didnt_happen' | 'deadline_issue' | 'stake_unclear' | 'other';
export type DisputeStatus = 'open' | 'voting' | 'resolved';
export type ViolationStatus = 'pending' | 'confirmed' | 'disputed' | 'dismissed';
export type NotificationType =
  | 'bet_invite'
  | 'bet_joined'
  | 'resolution_request'
  | 'outcome_proposed'
  | 'dispute_raised'
  | 'dispute_resolved'
  | 'bet_won'
  | 'bet_lost'
  | 'form_change'
  | 'jar_violation'
  | 'ledger_reset'
  | 'bet_deleted'
  | 'jar_cap_reached'
  | 'group_joined';
export type EventKind =
  | 'created'
  | 'joined'
  | 'side_switched'
  | 'went_live'
  | 'deadline_passed'
  | 'outcome_proposed'
  | 'agreed'
  | 'dispute_raised'
  | 'escalated'
  | 'evidence_added'
  | 'resolved'
  | 'undone'
  | 'cancelled';

export interface Profile {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean;
  form_score: number;
  current_streak: number;
  best_streak: number;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  invite_code: string;
  created_by: string;
  jar_cap_cents: number;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
}

export interface Bet {
  id: string;
  group_id: string | null;
  creator_id: string;
  title: string;
  type: BetType;
  stake_kind: StakeKind;
  stake_amount_cents: number | null;
  dare_forfeit: string | null;
  deadline: string;
  resolution_method: ResolutionMethod;
  judge_id: string | null;
  privacy: BetPrivacy;
  status: BetStatus;
  side_a_label: string;
  side_b_label: string;
  proposed_outcome: BetSide | null;
  proposed_by: string | null;
  proposed_at: string | null;
  winning_side: BetSide | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BetParticipant {
  bet_id: string;
  user_id: string;
  side: BetSide;
  agreed: boolean | null;
  joined_at: string;
}

export interface BetEvent {
  id: number;
  bet_id: string;
  actor_id: string | null;
  kind: EventKind;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface Dispute {
  id: string;
  bet_id: string;
  raised_by: string;
  reason: DisputeReason;
  detail: string | null;
  status: DisputeStatus;
  resolution_side: BetSide | null;
  closes_at: string;
  created_at: string;
}

export interface LedgerEntry {
  id: string;
  bet_id: string | null;
  violation_id: string | null;
  from_user: string;
  to_user: string | null; // null = group jar pot
  amount_cents: number;
  status: LedgerStatus;
  settled_at: string | null;
  created_at: string;
}

export interface FormEvent {
  id: number;
  user_id: string;
  delta: number;
  reason: string;
  bet_id: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  bet_id: string | null;
  group_id: string | null;
  actor_id: string | null;
  read_at: string | null;
  created_at: string;
}

export interface BetOption {
  id: string;
  bet_id: string;
  label: string;
  position: number;
  final_position: number | null;
}

export interface JarRule {
  id: string;
  group_id: string;
  emoji: string;
  label: string;
  amount_cents: number;
  created_by: string;
  active: boolean;
  created_at: string;
}

export interface JarViolation {
  id: string;
  group_id: string;
  rule_id: string;
  violator_id: string;
  reporter_id: string;
  owned_up: boolean;
  status: ViolationStatus;
  dispute_deadline: string;
  created_at: string;
}

export interface SharpenResult {
  sharpened: string;
  suggested_type: 'prediction' | 'dare' | 'open';
  suggested_deadline: string | null;
  confidence: 'high' | 'medium' | 'low';
}
