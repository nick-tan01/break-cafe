import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

import { supabase } from './supabase'

// Show order-status pushes even while the app is open in the foreground.
// Safe to set anywhere (including simulator) — it only affects how incoming
// notifications are presented.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

/**
 * Register this device for push notifications and save the Expo push token
 * on the signed-in user's profile (profiles.expo_push_token).
 *
 * Designed to no-op gracefully:
 * - simulators / web: returns null silently (expo-device check)
 * - permission denied: returns null silently (prompts at most once)
 * - no EAS projectId in app config yet: one console.warn, returns null
 *
 * Returns the token string on success, null otherwise. Never throws for the
 * expected "not set up yet" cases above.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Push tokens only exist on physical devices.
  if (!Device.isDevice) {
    return null
  }

  // Android 8+ requires a channel before notifications can display.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Order updates',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    })
  }

  // Ask for permission at most once; if the user said no, stay quiet.
  const { status: existingStatus, canAskAgain } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus
  if (existingStatus !== 'granted' && canAskAgain) {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') {
    return null
  }

  // Until `npx eas init` writes a projectId into app.json, there is no EAS
  // project to mint tokens against — warn once and bail instead of crashing.
  const projectId: string | undefined = Constants.expoConfig?.extra?.eas?.projectId
  if (!projectId) {
    console.warn(
      'Push notifications: no EAS projectId in app config — run `npx eas init` to enable push. Skipping registration.'
    )
    return null
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  // The profile row always exists (created by the on_auth_user_created
  // trigger), and RLS only grants UPDATE on profiles — so update, not upsert.
  const { error } = await supabase
    .from('profiles')
    .update({ expo_push_token: token })
    .eq('id', user.id)
  if (error) {
    console.warn('Push notifications: could not save push token:', error.message)
    return null
  }

  return token
}
