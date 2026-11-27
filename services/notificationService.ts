import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';
export async function registerPush(userId: string): Promise<string> {
  if (Platform.OS === 'web') throw new Error('Push notification memerlukan aplikasi native pada perangkat, bukan preview browser.');
  const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) throw new Error('Tetapkan projectId EAS melalui eas build:configure lalu build ulang aplikasi untuk mengaktifkan push.');
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('onlyus', { name: 'OnlyUS', importance: Notifications.AndroidImportance.HIGH });
  let permission = await Notifications.getPermissionsAsync(); if (!permission.granted) permission = await Notifications.requestPermissionsAsync(); if (!permission.granted) throw new Error('Izin notifikasi belum diberikan.');
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  const { error } = await getSupabaseClient().from('push_tokens').upsert({ user_id: userId, token, platform: Platform.OS, updated_at: new Date().toISOString() }, { onConflict: 'token' }); if (error) throw error;
  Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }) });
  return 'Notifikasi perangkat berhasil diaktifkan.';
}
export async function removePushTokens(userId: string) { if (Platform.OS === 'web') return; const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId; if (!projectId) return; try { const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId }); const { error } = await getSupabaseClient().from('push_tokens').delete().eq('user_id', userId).eq('token', token); if (error) throw error; } catch { /* Sign-out must remain available when notification registration is unavailable. */ } }
export async function deliverPendingNotifications() {
  const { data, error } = await getSupabaseClient().functions.invoke('onlyus-notification-worker', { body: {} });
  if (error) { let message = error.message; if (error instanceof FunctionsHttpError) { try { message = await error.context.text(); } catch { /* Keep original error. */ } } throw new Error(message); } return data;
}
