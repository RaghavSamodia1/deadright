// ── Auth & onboarding ────────────────────────────────────────────────────────
export { SplashScreen } from './SplashScreen';
export { OnboardingScreen } from './OnboardingScreen';
export { SignUpScreen } from './SignUpScreen';
export { OTPScreen } from './OTPScreen';
export { ProfileSetupScreen } from './ProfileSetupScreen';

// ── v2 hub-and-spoke (design-v2.md §2, §5) ───────────────────────────────────
export { HomeScreen } from './HomeScreen';           // V2-01 bento hub (route: Root)
export { LedgerScreen } from './LedgerScreen';        // V2-03
export { BetDetailScreen } from './BetDetailScreen';  // V2-04
export { ProfileScreen } from './ProfileScreen';      // V2-05
export { CredScreen } from './CredScreen';            // Cred score detail
export { RankPickerScreen } from './RankPickerScreen'; // ordinal bets
export { SearchScreen } from './SearchScreen';        // V2-06
export { AlertsScreen } from './AlertsScreen';        // V2-07
export { FeedScreen } from './FeedScreen';            // V2-08 (route: AllBets)

// ── Create flow ──────────────────────────────────────────────────────────────
export { CreateBetScreen } from './CreateBetScreen';
export { BetPlacedScreen } from './BetPlacedScreen';

// ── Party Pools (guest-facing web page lives in supabase/functions/pool) ─────
export { CreatePoolScreen } from './CreatePoolScreen';
export { PoolDetailScreen } from './PoolDetailScreen';
export { PoolsScreen } from './PoolsScreen';
export { SettleScreen } from './SettleScreen';

// ── Resolution & dispute ─────────────────────────────────────────────────────
export { SideSelectionScreen } from './SideSelectionScreen';
export { ResolutionScreen } from './ResolutionScreen';
export { EvidenceUploadScreen } from './EvidenceUploadScreen';
export { WinScreen } from './WinScreen';
export { DisputeDetailScreen } from './DisputeDetailScreen';

// ── Social & groups ──────────────────────────────────────────────────────────
export { FriendProfileScreen } from './FriendProfileScreen';
export { GroupScreen } from './GroupScreen';
export { GroupsScreen } from './GroupsScreen';
export { CreateGroupScreen } from './CreateGroupScreen';
export { JoinGroupScreen } from './JoinGroupScreen';
export { ShareInviteScreen } from './ShareInviteScreen';
export { AlertDetailScreen } from './AlertDetailScreen';

// ── Ledger ───────────────────────────────────────────────────────────────────
export { TransactionDetailScreen } from './TransactionDetailScreen';

// ── Cookie Jar (route: CookieJar) ────────────────────────────────────────────
export { SwearJarScreen } from './SwearJarScreen';
export { AllJarsScreen } from './AllJarsScreen';
export { AddViolationSheet } from './AddViolationSheet';
export { JarRulesScreen } from './JarRulesScreen';

// ── Settings ─────────────────────────────────────────────────────────────────
export { SettingsScreen } from './SettingsScreen';
export { ProfileEditScreen } from './ProfileEditScreen';
export { NotificationPrefsScreen } from './NotificationPrefsScreen';
export { PrivacyScreen } from './PrivacyScreen';
export { DeleteAccountScreen } from './DeleteAccountScreen';
export { BlockedUsersScreen } from './BlockedUsersScreen';

// ── Emotional peaks ──────────────────────────────────────────────────────────
export { RankUpScreen } from './RankUpScreen';
export { StreakScreen } from './StreakScreen';
export { FriendJoinedScreen } from './FriendJoinedScreen';
