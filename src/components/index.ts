// ── Primitives ───────────────────────────────────────────────────────────────
export { Avatar } from './Avatar/Avatar';
export type { AvatarSize } from './Avatar/Avatar';

export { AvatarStack } from './AvatarStack/AvatarStack';

export { StatusChip } from './StatusChip/StatusChip';
export type { BetStatus } from './StatusChip/StatusChip';

export { Button } from './Button/Button';
export type { ButtonVariant, ButtonSize } from './Button/Button';

export { FilterChip } from './FilterChip/FilterChip';

export { ChoiceChip, ChoiceChipGroup } from './ChoiceChip/ChoiceChip';

export { SegmentedControl } from './SegmentedControl/SegmentedControl';

export { Toggle } from './Toggle/Toggle';

export { ProgressDots } from './ProgressDots/ProgressDots';

// ── Inputs ───────────────────────────────────────────────────────────────────
export { TextInput } from './TextInput/TextInput';

export { OTPInput } from './OTPInput/OTPInput';

// ── Data display ─────────────────────────────────────────────────────────────
export { SideBar } from './SideBar/SideBar';

export { Timer } from './Timer/Timer';

export { FormRing } from './FormRing/FormRing';

export { BetCard } from './BetCard/BetCard';
export type { BetCardData } from './BetCard/BetCard';

export { ListRow } from './ListRow/ListRow';

// ── Layout & chrome ──────────────────────────────────────────────────────────
export { NavHeader } from './NavHeader/NavHeader';

/** @deprecated UI v2 has no bottom nav (design-v2.md §2) — kept for v1 reference only. */
export { TabBar } from './TabBar/TabBar';
export type { TabName } from './TabBar/TabBar';

export { BottomSheet } from './BottomSheet/BottomSheet';

// ── Feedback & moments ───────────────────────────────────────────────────────
export { EmptyState } from './EmptyState/EmptyState';

export { Toast } from './Toast/Toast';
export type { ToastType } from './Toast/Toast';

export { Stamp } from './Stamp/Stamp';

// ── Feature cards (Sinport bag-drop style) ───────────────────────────────────
export { StatCard } from './StatCard/StatCard';
export type { StatCardTone } from './StatCard/StatCard';

export { InviteCodeCard } from './InviteCodeCard/InviteCodeCard';

export { CountdownCard } from './CountdownCard/CountdownCard';

export { GroupCard } from './GroupCard/GroupCard';

export { TimelineEvent } from './TimelineEvent/TimelineEvent';
export type { TimelineTone } from './TimelineEvent/TimelineEvent';

export { Banner } from './Banner/Banner';
export type { BannerTone } from './Banner/Banner';

export { SearchBar } from './SearchBar/SearchBar';

export { SkeletonBlock, SkeletonBetCard } from './Skeleton/Skeleton';

export { ActionSheet } from './ActionSheet/ActionSheet';
export type { ActionSheetOption } from './ActionSheet/ActionSheet';

export { ScreenBackground } from './ScreenBackground/ScreenBackground';
export type { BackgroundTone } from './ScreenBackground/ScreenBackground';

// ── Swear Jar & Settings ─────────────────────────────────────────────────────
export { JarCard } from './JarCard/JarCard';

export { ViolationRow } from './ViolationRow/ViolationRow';

export { SettingsRow, SettingsSection } from './SettingsRow/SettingsRow';

// ── Screen-derived patterns ──────────────────────────────────────────────────
export { SuggestionCard } from './SuggestionCard/SuggestionCard';

export { StatsRow } from './StatsRow/StatsRow';
export type { Stat } from './StatsRow/StatsRow';

export { UploadZone } from './UploadZone/UploadZone';

export { NotificationRow } from './NotificationRow/NotificationRow';
export type { NotificationAction } from './NotificationRow/NotificationRow';

// ── v2 Bento (design-v2.md) ──────────────────────────────────────────────────
export {
  BentoTile,
  TILE_SIZES,
  tileSizesFor,
  tileScaleFor,
  useTileSizes,
} from './BentoTile/BentoTile';
export type { TileSize, TileTone, TileDims } from './BentoTile/BentoTile';

export { Icon, type IconName } from './Icon/Icon';
export { Emblem, type EmblemName } from './Emblem/Emblem';

export { Rise } from './Motion/Rise';
export { Swap } from './Motion/Swap';
export { CountUp } from './Motion/CountUp';
export { usePressScale, AnimatedPressable } from './Motion/usePressScale';
export { Atmosphere } from './Atmosphere/Atmosphere';
export { Confetti } from './Confetti/Confetti';
export { SoundBoard } from './SoundBoard/SoundBoard';
