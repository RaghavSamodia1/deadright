import React from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../lib/AuthContext';
import { colors } from '../tokens';
import {
  SplashScreen,
  OnboardingScreen,
  SignUpScreen,
  OTPScreen,
  ProfileSetupScreen,
  HomeScreen,
  LedgerScreen,
  BetDetailScreen,
  ProfileScreen,
  FormScreen,
  RankPickerScreen,
  SearchScreen,
  AlertsScreen,
  FeedScreen,
  CreateBetScreen,
  BetPlacedScreen,
  CreatePoolScreen,
  PoolDetailScreen,
  PoolsScreen,
  SettleScreen,
  GroupMembersScreen,
  GroupSettingsScreen,
  SideSelectionScreen,
  ResolutionScreen,
  EvidenceUploadScreen,
  WinScreen,
  DisputeDetailScreen,
  FriendProfileScreen,
  GroupScreen,
  GroupsScreen,
  CreateGroupScreen,
  JoinGroupScreen,
  ShareInviteScreen,
  AlertDetailScreen,
  TransactionDetailScreen,
  SwearJarScreen,
  AllJarsScreen,
  JarRulesScreen,
  SettingsScreen,
  ProfileEditScreen,
  NotificationPrefsScreen,
  PrivacyScreen,
  DeleteAccountScreen,
  BlockedUsersScreen,
  RankUpScreen,
  StreakScreen,
  FriendJoinedScreen,
} from '../screens';

// Hub-and-spoke, no bottom tab bar (design-v2.md §2). One native stack:
// auth → Root (bento Home) → everything pushes with a back header.
export type RootStackParamList = Record<string, object | undefined>;

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthed, loading, needsProfile } = useAuth();

  // Hold on the navy base while the stored session is read — avoids a flash of
  // the auth stack for users who are already signed in.
  if (loading) {
    return <View style={{ flex: 1, backgroundColor: colors.bg.base }} />;
  }

  // Signed out: only the auth stack exists. Screens must NOT navigate manually
  // after signing in — the session change swaps the whole stack below, and a
  // replace() from a screen that's unmounting in the same render is dropped.
  if (!isAuthed) {
    return (
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="OTP" component={OTPScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={needsProfile ? 'ProfileSetup' : 'Root'}
      // Android's native-stack default is a fade-through, iOS pushes from the
      // right. Same app, two different ideas about where a screen comes from —
      // pinning it means back always reverses the way forward went.
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />

      {/* Hub + spokes */}
      <Stack.Screen name="Root" component={HomeScreen} />
      <Stack.Screen name="Ledger" component={LedgerScreen} />
      <Stack.Screen name="BetDetail" component={BetDetailScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Form" component={FormScreen} />
      <Stack.Screen name="RankPicker" component={RankPickerScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Alerts" component={AlertsScreen} />
      <Stack.Screen name="AllBets" component={FeedScreen} />
      <Stack.Screen name="CookieJar" component={SwearJarScreen} />
      <Stack.Screen name="AllJars" component={AllJarsScreen} />
      <Stack.Screen name="JarRules" component={JarRulesScreen} />
      <Stack.Screen name="PoolDetail" component={PoolDetailScreen} />
      <Stack.Screen name="Pools" component={PoolsScreen} />
      <Stack.Screen name="Settle" component={SettleScreen} />
      <Stack.Screen name="GroupMembers" component={GroupMembersScreen} />
      <Stack.Screen name="GroupSettings" component={GroupSettingsScreen} />

      {/* Resolution & dispute */}
      <Stack.Screen name="Resolution" component={ResolutionScreen} />
      <Stack.Screen name="EvidenceUpload" component={EvidenceUploadScreen} />
      <Stack.Screen name="DisputeDetail" component={DisputeDetailScreen} />

      {/* Social & groups */}
      <Stack.Screen name="FriendProfile" component={FriendProfileScreen} />
      <Stack.Screen name="Group" component={GroupScreen} />
      <Stack.Screen name="Groups" component={GroupsScreen} />
      <Stack.Screen name="AlertDetail" component={AlertDetailScreen} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />

      {/* Settings */}
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
      <Stack.Screen name="NotificationPrefs" component={NotificationPrefsScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />

      {/* Modals (sheets & wizards) */}
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen name="CreateBet" component={CreateBetScreen} />
        <Stack.Screen name="CreatePool" component={CreatePoolScreen} />
        <Stack.Screen name="SideSelection" component={SideSelectionScreen} />
        <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
        <Stack.Screen name="JoinGroup" component={JoinGroupScreen} />
        <Stack.Screen name="ShareInvite" component={ShareInviteScreen} />
        <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
      </Stack.Group>

      {/* Emotional peaks — full-screen takeovers */}
      <Stack.Group screenOptions={{ presentation: 'fullScreenModal', animation: 'fade' }}>
        <Stack.Screen name="BetPlaced" component={BetPlacedScreen} />
        <Stack.Screen name="Win" component={WinScreen} />
        <Stack.Screen name="RankUp" component={RankUpScreen} />
        <Stack.Screen name="Streak" component={StreakScreen} />
        <Stack.Screen name="FriendJoined" component={FriendJoinedScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
}
