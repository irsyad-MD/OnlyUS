import * as Crypto from 'expo-crypto';
import { getSupabaseClient } from './supabase';
import { signedImage, uploadImage } from './mediaService';
export interface SharedPhoto { id: string; couple_id: string; user_id: string; image_url: string; uri: string | null; title: string; description: string; created_at: string; }
export interface Artwork extends SharedPhoto { design: 'classic' | 'polaroid' | 'minimal'; }
export interface Memory extends SharedPhoto { captured_at: string; date_source: 'exif' | 'file' | 'manual' | 'camera'; is_anniversary: boolean; }
export interface Stroke { color: string; width: number; points: { x: number; y: number }[]; }
export interface Drawing { id: string; couple_id: string; sender_id: string; image_url: string; uri: string | null; strokes: Stroke[]; caption: string; status: 'sent' | 'received'; created_at: string; }
export interface LoveSummary { mine: number; partner: number; total: number; last_partner_at: string | null; server_now: string; }
export interface LoveEvent { id: string; sender_id: string; created_at: string; }
export interface LocationRow { user_id: string; couple_id: string; latitude: number | null; longitude: number | null; accuracy: number | null; sharing_mode: 'off' | 'live' | 'stealth'; location_label: string; session_started_at: string | null; coordinates_verified_at: string | null; history_enabled: boolean; battery_consent: boolean; battery_level: number | null; }
export interface LocationSession { id: string; user_id: string; location_label: string; started_at: string; ended_at: string | null; }
export interface AppNotification { id: string; type: string; title: string; body: string; payload: Record<string, string>; is_read: boolean; created_at: string; }
export const notificationTypes = ['love', 'memory', 'drawing', 'artwork', 'stealth', 'connection'] as const;
export interface SpaceData { artworks: Artwork[]; memories: Memory[]; drawings: Drawing[]; artworkFavorites: string[]; memoryFavorites: string[]; reactions: { memory_id: string; user_id: string; reaction: string }[]; love: LoveSummary; loveEvents: LoveEvent[]; locations: LocationRow[]; locationHistory: LocationSession[]; allowStealth: boolean; serverOffset: number; notifications: AppNotification[]; preferences: Record<string, boolean>; }
export function emptySpaceData(): SpaceData { return { artworks: [], memories: [], drawings: [], artworkFavorites: [], memoryFavorites: [], reactions: [], love: { mine: 0, partner: 0, total: 0, last_partner_at: null, server_now: '' }, loveEvents: [], locations: [], locationHistory: [], allowStealth: true, serverOffset: 0, notifications: [], preferences: {} }; }
export async function loadSpaceData(spaceId: string, userId: string): Promise<SpaceData> {
  const client = getSupabaseClient(); const start = Date.now();
  const results = await Promise.all([
    client.from('artworks').select('*').eq('couple_id', spaceId).order('created_at', { ascending: false }).limit(200),
    client.from('memories').select('*').eq('couple_id', spaceId).order('captured_at', { ascending: false }).limit(200),
    client.from('drawings').select('*').eq('couple_id', spaceId).order('created_at', { ascending: false }).limit(100),
    client.from('artwork_favorites').select('artwork_id').eq('couple_id', spaceId).eq('user_id', userId),
    client.from('memory_favorites').select('memory_id').eq('couple_id', spaceId).eq('user_id', userId),
    client.from('memory_reactions').select('memory_id,user_id,reaction').eq('couple_id', spaceId),
    client.rpc('onlyus_love_summary', { space_id: spaceId }),
    client.from('love_events').select('id,sender_id,created_at').eq('couple_id', spaceId).order('created_at', { ascending: false }).limit(50),
    client.rpc('onlyus_get_locations', { space_id: spaceId }),
    client.from('location_sessions').select('id,user_id,location_label,started_at,ended_at').eq('couple_id', spaceId).order('started_at', { ascending: false }).limit(50),
    client.from('notifications').select('*').eq('user_id', userId).eq('couple_id', spaceId).order('created_at', { ascending: false }).limit(100),
    client.from('notification_preferences').select('type,enabled').eq('user_id', userId),
  ]);
  for (const result of results) if (result.error) throw result.error;
  const decorate = async <T extends { image_url: string }>(rows: T[]): Promise<(T & { uri: string | null })[]> => Promise.all(rows.map(async row => ({ ...row, uri: await signedImage('onlyus-media', row.image_url).catch(() => null) })));
  const [artworks, memories, drawings] = await Promise.all([decorate(results[0].data ?? []), decorate(results[1].data ?? []), decorate(results[2].data ?? [])]);
  const locations = results[8].data;
  return { artworks: artworks as Artwork[], memories: memories as Memory[], drawings: drawings as Drawing[], artworkFavorites: (results[3].data ?? []).map(row => row.artwork_id), memoryFavorites: (results[4].data ?? []).map(row => row.memory_id), reactions: results[5].data ?? [], love: results[6].data, loveEvents: results[7].data ?? [], locations: locations.locations ?? [], locationHistory: results[9].data ?? [], allowStealth: locations.allow_stealth !== false, serverOffset: Date.parse(locations.server_now) - (start + Date.now()) / 2, notifications: results[10].data ?? [], preferences: Object.fromEntries((results[11].data ?? []).map(row => [row.type, row.enabled])) };
}
export function newRequestId() { return Crypto.randomUUID(); }
export async function sendLove(spaceId: string, key: string): Promise<LoveSummary> { const { data, error } = await getSupabaseClient().rpc('onlyus_send_love', { space_id: spaceId, request_key: key }); if (error) throw error; return data; }
export async function saveSharedPhoto(table: 'artworks' | 'memories', row: Record<string, unknown>, uri: string, existingPath?: string): Promise<string> {
  const client = getSupabaseClient();
  const found = await client.from(table).select('id,image_url').eq('id', String(row.id)).maybeSingle(); if (found.error) throw found.error; if (found.data) return found.data.image_url;
  const path = existingPath ?? await uploadImage(uri, 'onlyus-media', `${row.couple_id}/${row.user_id}`);
  const { error } = await client.from(table).insert({ ...row, image_url: path });
  if (error) { const retry = await client.from(table).select('id').eq('id', String(row.id)).maybeSingle(); if (retry.error || !retry.data) throw Object.assign(new Error(error.message), { uploadedPath: path }); }
  return path;
}
export async function saveDrawing(row: Record<string, unknown>, uri: string, existingPath?: string) {
  const client = getSupabaseClient(); const found = await client.from('drawings').select('id').eq('id', String(row.id)).maybeSingle(); if (found.error) throw found.error; if (found.data) return;
  const path = existingPath ?? await uploadImage(uri, 'onlyus-media', `${row.couple_id}/${row.sender_id}`);
  const { error } = await client.from('drawings').insert({ ...row, image_url: path });
  if (error) { const check = await client.from('drawings').select('id').eq('id', String(row.id)).maybeSingle(); if (check.error || !check.data) throw Object.assign(new Error(error.message), { uploadedPath: path }); }
}
export async function updatePhoto(table: 'artworks' | 'memories', id: string, values: Record<string, unknown>, userId: string) { const { error } = await getSupabaseClient().from(table).update(values).eq('id', id).eq('user_id', userId); if (error) throw error; }
export async function deleteContent(table: 'artworks' | 'memories' | 'drawings', id: string, userId: string) { const { error } = await getSupabaseClient().from(table).delete().eq('id', id).eq(table === 'drawings' ? 'sender_id' : 'user_id', userId); if (error) throw error; }
export async function setFavorite(kind: 'artwork' | 'memory', id: string, spaceId: string, userId: string, enabled: boolean) {
  const table = kind === 'artwork' ? 'artwork_favorites' : 'memory_favorites'; const column = `${kind}_id`; const client = getSupabaseClient();
  const { error } = enabled ? await client.from(table).insert({ id: newRequestId(), user_id: userId, couple_id: spaceId, [column]: id }) : await client.from(table).delete().eq('user_id', userId).eq(column, id);
  if (error && error.code !== '23505') throw error;
}
export async function reactMemory(id: string, spaceId: string, userId: string, enabled: boolean) {
  const client = getSupabaseClient(); if (!enabled) { const { error } = await client.from('memory_reactions').delete().eq('memory_id', id).eq('user_id', userId); if (error) throw error; return; }
  const { error } = await client.from('memory_reactions').insert({ id: newRequestId(), memory_id: id, user_id: userId, couple_id: spaceId, reaction: 'heart' }); if (error && error.code !== '23505') throw error;
}
export async function receiveDrawing(id: string) { const { error } = await getSupabaseClient().rpc('onlyus_receive_drawing', { drawing_id: id }); if (error) throw error; }
export async function locationMode(spaceId: string, mode: LocationRow['sharing_mode'], history: boolean, battery: boolean) { const { data, error } = await getSupabaseClient().rpc('onlyus_set_location_mode', { space_id: spaceId, requested_mode: mode, keep_history: history, share_battery: battery }); if (error) throw error; return data as { location: LocationRow; server_now: string }; }
export async function markNotification(id: string) { const { error } = await getSupabaseClient().from('notifications').update({ is_read: true }).eq('id', id); if (error) throw error; }
export async function saveNotificationPreference(userId: string, type: string, enabled: boolean) { const { error } = await getSupabaseClient().from('notification_preferences').upsert({ user_id: userId, type, enabled }, { onConflict: 'user_id,type' }); if (error) throw error; }
