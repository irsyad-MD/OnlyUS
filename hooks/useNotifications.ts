import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useOnlyus } from './useOnlyus';
import { useSpaceData } from './useSpaceData';
import { registerPush, deliverPendingNotifications } from '@/services/notificationService';
import { errorMessage } from '@/services/errorService';
import { AppNotification } from '@/services/spaceDataService';
export function useNotificationRouting() { const router = useRouter(); useEffect(() => { if (Platform.OS === 'web') return; const route = (type: string) => { if (['love', 'memory', 'artwork', 'drawing', 'stealth'].includes(type)) router.push({ pathname: '/feature', params: { id: ({ memory: 'memories', drawing: 'widget', stealth: 'maps' } as Record<string, string>)[type] ?? type } }); else router.push('/space'); };
  const listener = Notifications.addNotificationResponseReceivedListener(response => { route(String(response.notification.request.content.data.type ?? '')); }); let alive = true; void Notifications.getLastNotificationResponseAsync().then(response => { if (alive && response) route(String(response.notification.request.content.data.type ?? '')); }); return () => { alive = false; listener.remove(); }; }, [router]); }
export function useNotifications() { const account = useOnlyus(); const state = useSpaceData(); const router = useRouter(); const [message, setMessage] = useState(''); const [success, setSuccess] = useState(false); const [registering, setRegistering] = useState(false);
  const enable = useCallback(async () => { setRegistering(true); setSuccess(false); setMessage(''); try { setMessage(await registerPush(account.session!.user.id)); setSuccess(true); } catch (err) { setMessage(errorMessage(err)); } finally { setRegistering(false); } }, [account.session?.user.id]);
  const deliver = useCallback(async () => { setRegistering(true); setMessage(''); setSuccess(false); try { const result = await deliverPendingNotifications(); setMessage(`${result?.sent ?? 0} notifikasi dikirim ke Expo. Penerimaan perangkat mengikuti layanan push.`); setSuccess(true); } catch (err) { setMessage(errorMessage(err)); } finally { setRegistering(false); } }, []);
  const openNotification = useCallback(async (item: AppNotification) => { if (!item.is_read) await state.read(item.id); router.push({ pathname: '/feature', params: { id: ({ love: 'love', memory: 'memories', artwork: 'artwork', drawing: 'widget', stealth: 'maps', connection: 'connection' } as Record<string, string>)[item.type] ?? '' } }); }, [state.read, router]);
  return { ...account, ...state, message, success, registering, enable, deliver, openNotification };
}
