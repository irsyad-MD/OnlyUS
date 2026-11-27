import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { useOnlyus } from '@/hooks/useOnlyus';
export function TabLayout() {
  const insets = useSafeAreaInsets(); const { colors } = useOnlyus();
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.subtle, tabBarLabelStyle: { fontSize: 10, fontWeight: '600' }, tabBarStyle: { height: Platform.select({ ios: insets.bottom + 60, android: insets.bottom + 60, default: 70 }), paddingTop: 8, paddingBottom: Platform.select({ ios: insets.bottom + 8, android: insets.bottom + 8, default: 8 }), paddingHorizontal: 16, backgroundColor: colors.surface, borderTopColor: colors.border } }}><Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={size} /> }} /><Tabs.Screen name="artwork" options={{ title: 'I Love U', tabBarIcon: ({ color, size }) => <Feather name="image" color={color} size={size} /> }} /><Tabs.Screen name="love" options={{ title: 'Love Me', tabBarIcon: ({ color, size }) => <Feather name="heart" color={color} size={size} /> }} /><Tabs.Screen name="maps" options={{ title: 'Maps', tabBarIcon: ({ color, size }) => <Feather name="map-pin" color={color} size={size} /> }} /><Tabs.Screen name="memories" options={{ title: 'OurDays', tabBarIcon: ({ color, size }) => <Feather name="camera" color={color} size={size} /> }} /></Tabs>;
}
export default TabLayout;
