import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
const chunkSize = 1800;
const storage = {
  async getItem(key: string) {
    if (Platform.OS === 'web') return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    const count = Number(await SecureStore.getItemAsync(`${key}-count`) ?? 0);
    if (!count) return null;
    const chunks = await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${key}-${i}`)));
    return chunks.some(v => v === null) ? null : chunks.join('');
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') { if (typeof window !== 'undefined') window.localStorage.setItem(key, value); return; }
    const oldCount = Number(await SecureStore.getItemAsync(`${key}-count`) ?? 0);
    const count = Math.ceil(value.length / chunkSize);
    for (let i = 0; i < count; i++) await SecureStore.setItemAsync(`${key}-${i}`, value.slice(i * chunkSize, (i + 1) * chunkSize));
    await SecureStore.setItemAsync(`${key}-count`, String(count));
    for (let i = count; i < oldCount; i++) await SecureStore.deleteItemAsync(`${key}-${i}`);
  },
  async removeItem(key: string) {
    if (Platform.OS === 'web') { if (typeof window !== 'undefined') window.localStorage.removeItem(key); return; }
    const count = Number(await SecureStore.getItemAsync(`${key}-count`) ?? 0);
    for (let i = 0; i < count; i++) await SecureStore.deleteItemAsync(`${key}-${i}`);
    await SecureStore.deleteItemAsync(`${key}-count`);
  },
};
let client: SupabaseClient | null = null;
export function isBackendConfigured() { return Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY); }
export function getSupabaseClient() {
  if (!isBackendConfigured()) throw new Error('Konfigurasi Supabase belum tersedia. Pastikan koneksi project menghasilkan EXPO_PUBLIC_SUPABASE_URL dan EXPO_PUBLIC_SUPABASE_ANON_KEY, lalu muat ulang preview. Jangan gunakan service role key.');
  if (!client) client = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!, { auth: { storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } });
  return client;
}
