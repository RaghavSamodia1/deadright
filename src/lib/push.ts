import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

/**
 * Push notifications.
 *
 * Every path in the app has always written to the notifications table, and
 * nothing ever left the database — the rows waited for somebody to open the
 * alerts screen and find them, which is an inbox rather than a notification.
 *
 * Nothing here throws. A device that will not give a token, an account with no
 * project configured, a user who said no — all of them mean "no push", and none
 * of them are worth interrupting sign-in over. The alerts screen is unaffected
 * either way.
 */

// Foreground behaviour. Without this a push that lands while the app is open is
// swallowed, which reads as the notification not working at all.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // shouldShowAlert is the field this SDK requires; the banner/list pair is
    // its successor and is set too so the behaviour survives the upgrade.
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Expo mints tokens per project, so without a project id there is no token to
 * be had. It is absent until `eas init` writes one into app.json.
 */
function projectId(): string | undefined {
  const extra: any = Constants.expoConfig?.extra;
  return extra?.eas?.projectId;
}

/** True when this build could actually receive a push, if permitted. */
export function pushIsConfigured(): boolean {
  return !!projectId();
}

export async function registerForPush(): Promise<string | null> {
  try {
    // A simulator has no push service behind it and will never get a token.
    if (!Device.isDevice) return null;
    if (!projectId()) return null;

    if (Platform.OS === 'android') {
      // Android needs a channel before anything can be delivered to it, and the
      // channel is what carries the importance, the light and the vibration.
      await Notifications.setNotificationChannelAsync('default', {
        name: 'DeadRight',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F7C846',
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return null;

    const token = (await Notifications.getExpoPushTokenAsync({ projectId: projectId()! })).data;
    // Definer RPC rather than a direct upsert: the row may currently belong to
    // whoever was signed in on this handset before, and an insert policy cannot
    // grant you the right to overwrite somebody else's row.
    await supabase.rpc('claim_push_token', { p_token: token, p_platform: Platform.OS });
    return token;
  } catch {
    return null;
  }
}

/**
 * Stop pushing to this device on sign-out. Without it, the next notification
 * for the account that just left would arrive on a handset somebody else is
 * now using.
 */
export async function unregisterPush(): Promise<void> {
  try {
    if (!Device.isDevice || !projectId()) return;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId: projectId()! })).data;
    await supabase.from('push_tokens').delete().eq('token', token);
  } catch {
    // Signing out matters more than tidying up.
  }
}

/** Where a tapped notification should take you. */
export interface PushTarget {
  betId?: string;
  groupId?: string;
  notificationId?: string;
}

export function targetFrom(response: Notifications.NotificationResponse): PushTarget {
  const data: any = response.notification.request.content.data ?? {};
  return {
    betId: data.betId ?? undefined,
    groupId: data.groupId ?? undefined,
    notificationId: data.notificationId ?? undefined,
  };
}
