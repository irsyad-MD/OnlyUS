import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { OnlyusProvider } from '@/contexts/OnlyusContext';
import { SpaceDataProvider } from '@/contexts/SpaceDataContext';
import { GpsStatusProvider } from '@/contexts/GpsStatusContext';
import { WidgetSync } from '@/components/widgets/WidgetSync';
import { registerOnlyusWidgets } from '@/components/widgets/OnlyusWidget';
import { useNotificationRouting } from '@/hooks/useNotifications';
registerOnlyusWidgets();
import { useOnlyus } from '@/hooks/useOnlyus';
function AppNavigator() {
  const { colors, theme } = useOnlyus();
  useNotificationRouting();
  return <><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text, headerShadowVisible: false }}><Stack.Screen name="index" /><Stack.Screen name="login" /><Stack.Screen name="(tabs)" /><Stack.Screen name="space" options={{ headerShown: true, title: 'Couple Space' }} /><Stack.Screen name="themes" options={{ headerShown: true, title: 'Tema' }} /><Stack.Screen name="settings" options={{ headerShown: true, title: 'Akun' }} /><Stack.Screen name="feature" options={{ headerShown: true, title: 'OnlyUS' }} /><Stack.Screen name="notifications" options={{ headerShown: true, title: 'Notifikasi' }} /></Stack><StatusBar style={theme.theme_name === 'midnightLove' ? 'light' : 'auto'} /></>;
}
export function RootLayout() { return <SafeAreaProvider><OnlyusProvider><SpaceDataProvider><GpsStatusProvider><WidgetSync /><AppNavigator /></GpsStatusProvider></SpaceDataProvider></OnlyusProvider></SafeAreaProvider>; }
export default RootLayout;
