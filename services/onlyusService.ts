import { getSupabaseClient } from './supabase';
import { signedImage } from './mediaService';
import { ThemeName, themeNames } from '@/constants/theme';
export interface Profile { id: string; email: string; username: string; avatar_url: string | null; avatarUri?: string | null; }
export interface CoupleSpace { id: string; couple_code: string; status: 'waiting' | 'active'; together_since: string | null; invite_expires_at: string; partner: { id: string; username: string; avatar_url: string | null; avatarUri?: string | null } | null; }
export interface ThemePreference { theme_name: ThemeName; custom_colors: Record<string, string>; }
export async function loadAccount(userId: string) {
  const supabase = getSupabaseClient();
  const [profile, theme, space] = await Promise.all([supabase.from('profiles').select('id,email,username,avatar_url').eq('id', userId).single(), supabase.from('themes').select('theme_name,custom_colors').eq('user_id', userId).maybeSingle(), supabase.rpc('onlyus_get_space')]);
  if (profile.error) throw profile.error;
  if (theme.error) throw theme.error;
  if (space.error) throw space.error;
  const preference = theme.data as ThemePreference | null;
  const own = profile.data as Profile; const couple = space.data as CoupleSpace | null;
  own.avatarUri = await signedImage('onlyus-avatars', own.avatar_url).catch(() => null);
  if (couple?.partner) couple.partner.avatarUri = await signedImage('onlyus-avatars', couple.partner.avatar_url).catch(() => null);
  return { profile: own, theme: preference && preference.theme_name in themeNames ? preference : { theme_name: 'softPink' as ThemeName, custom_colors: {} }, space: couple };
}
export async function createSpace(date: string) {
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) throw new Error('Gunakan tanggal valid dengan format YYYY-MM-DD.');
  const { data, error } = await getSupabaseClient().rpc('onlyus_create_space', { start_date: date || null });
  if (error) throw error;
  return data;
}
export async function joinSpace(code: string) {
  if (!/^[a-zA-Z0-9]{12}$/.test(code.trim())) throw new Error('Kode undangan harus terdiri dari 12 huruf atau angka.');
  const { data, error } = await getSupabaseClient().rpc('onlyus_join_space', { invite_code: code.trim().toUpperCase() });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}
export async function disconnectSpace() { const { error } = await getSupabaseClient().rpc('onlyus_disconnect_space'); if (error) throw error; }
export async function saveTheme(userId: string, theme: ThemePreference) { const { error } = await getSupabaseClient().from('themes').upsert({ user_id: userId, ...theme }, { onConflict: 'user_id' }); if (error) throw error; }
export async function saveProfile(userId: string, username: string) { if (!username.trim() || username.trim().length > 60) throw new Error('Nama wajib diisi, maksimal 60 karakter.'); const { error } = await getSupabaseClient().from('profiles').update({ username: username.trim() }).eq('id', userId); if (error) throw error; }
