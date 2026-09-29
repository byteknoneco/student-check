import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerPushToken(userId: string): Promise<string | null> {
  if (!supabase || !Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'DersTakip+ bildirimleri',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
    });
  }

  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') return null;

  const projectId =
    process.env.EXPO_PUBLIC_EXPO_PROJECT_ID ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId || projectId === 'REPLACE_WITH_EXPO_PROJECT_ID') return null;

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    const { error } = await supabase.from('push_tokens').upsert(
      {
        user_id: userId,
        token,
        platform: Platform.OS,
        device_name: Device.deviceName ?? Device.modelName ?? null,
        active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'token' },
    );
    if (error) throw error;
    return token;
  } catch {
    return null;
  }
}

export async function disablePushToken(token: string) {
  if (!supabase) return;
  await supabase.from('push_tokens').update({ active: false }).eq('token', token);
}

export async function presentLocalNotification(title: string, body: string, data: Record<string, unknown> = {}) {
  try {
    await Notifications.scheduleNotificationAsync({ content: { title, body, data }, trigger: null });
  } catch {
    // Local notification is best-effort.
  }
}
