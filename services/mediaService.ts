import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from './fileSystemService';
import * as Crypto from 'expo-crypto';
import { decode } from 'base64-arraybuffer';
import * as exifr from 'exifr';
import { getSupabaseClient } from './supabase';
export interface PickedPhoto { uri: string; capturedAt: string | null; dateSource: 'exif' | 'file' | 'manual' | 'camera'; }
export function parsePhotoDate(value: unknown): string | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
  if (typeof value !== 'string') return null;
  const match = value.match(/^(\d{4})[:\-](\d{2})[:\-](\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, y, m, d, h, min, s] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min), Number(s));
  if (date.getFullYear() !== Number(y) || date.getMonth() + 1 !== Number(m) || date.getDate() !== Number(d) || date.getHours() !== Number(h) || date.getMinutes() !== Number(min) || date.getSeconds() !== Number(s)) return null;
  return date.toISOString();
}
export function manualDate(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new Error('Tanggal harus berformat YYYY-MM-DD.');
  const [, y, m, d] = match; const date = new Date(Number(y), Number(m) - 1, Number(d), 12);
  if (date.getFullYear() !== Number(y) || date.getMonth() + 1 !== Number(m) || date.getDate() !== Number(d) || date.getTime() > Date.now() + 86400000) throw new Error('Tanggal kenangan tidak valid.');
  return date.toISOString();
}
export function dateInput(iso: string | null) { if (!iso) return ''; const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
export async function pickPhoto(camera: boolean): Promise<PickedPhoto | null> {
  const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error(`Izin ${camera ? 'kamera' : 'galeri'} diperlukan. Aktifkan melalui pengaturan perangkat.`);
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1, exif: true, allowsEditing: false };
  const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  const exif = asset.exif ?? {};
  for (const source of [exif, exif['{Exif}'] ?? {}, exif['{TIFF}'] ?? {}]) for (const key of ['DateTimeOriginal', 'DateTimeDigitized', 'DateTime', 'CreateDate']) { const date = parsePhotoDate(source[key]); if (date) return { uri: asset.uri, capturedAt: date, dateSource: camera ? 'camera' : 'exif' }; }
  if (camera) return { uri: asset.uri, capturedAt: new Date().toISOString(), dateSource: 'camera' };
  // Read original bytes before resizing so EXIF is not lost, including on web.
  try {
    let bytes: ArrayBuffer | null = null;
    if (Platform.OS === 'web') { const response = await fetch(asset.uri); if (response.ok) { const blob = await response.blob(); if (blob.size <= 25000000) bytes = await blob.arrayBuffer(); } }
    else { const info = await FileSystem.getInfoAsync(asset.uri); if (info.exists && info.size <= 25000000) bytes = decode(await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 })); }
    if (bytes) { const metadata = await exifr.parse(bytes, { gps: false }); for (const key of ['DateTimeOriginal', 'CreateDate', 'DateTimeDigitized', 'ModifyDate']) { const date = parsePhotoDate(metadata?.[key]); if (date) return { uri: asset.uri, capturedAt: date, dateSource: 'exif' }; } }
  } catch { /* Missing EXIF falls back to explicit file/manual dates, never upload time. */ }
  if (Platform.OS !== 'web' && asset.assetId) {
    try { const permission = await MediaLibrary.requestPermissionsAsync(false, ['photo']); if (permission.granted) { const info = await MediaLibrary.getAssetInfoAsync(asset.assetId); if (info.creationTime > 0) return { uri: asset.uri, capturedAt: new Date(info.creationTime).toISOString(), dateSource: 'file' }; } } catch { /* No fabricated date when library metadata is unavailable. */ }
  }
  return { uri: asset.uri, capturedAt: null, dateSource: 'manual' };
}
const signed = new Map<string, { uri: string; expires: number }>();
export async function signedImage(bucket: string, path: string | null): Promise<string | null> {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  const key = `${bucket}/${path}`; const cached = signed.get(key);
  if (cached && cached.expires > Date.now()) return cached.uri;
  const { data, error } = await getSupabaseClient().storage.from(bucket).createSignedUrl(path, 120);
  if (error) throw error;
  signed.set(key, { uri: data.signedUrl, expires: Date.now() + 60000 }); return data.signedUrl;
}
export function clearImageCache() { signed.clear(); }
export async function uploadImage(uri: string, bucket: 'onlyus-avatars' | 'onlyus-media', prefix: string): Promise<string> {
  const image = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1400 } }], { compress: .82, format: ImageManipulator.SaveFormat.JPEG });
  let bytes: ArrayBuffer;
  if (Platform.OS === 'web') { const response = await fetch(image.uri); if (!response.ok) throw new Error('Gambar tidak dapat dibaca.'); bytes = await response.arrayBuffer(); }
  else { const base64 = await FileSystem.readAsStringAsync(image.uri, { encoding: FileSystem.EncodingType.Base64 }); bytes = decode(base64); }
  if (!bytes.byteLength || bytes.byteLength > 5242880) throw new Error('Ukuran foto maksimum 5 MB setelah kompresi.');
  const path = `${prefix}/${Crypto.randomUUID()}.jpg`;
  const { error } = await getSupabaseClient().storage.from(bucket).upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error; return path;
}
export async function removeImage(bucket: string, path: string) { const { error } = await getSupabaseClient().storage.from(bucket).remove([path]); if (error) throw error; signed.delete(`${bucket}/${path}`); }
export async function setAvatar(userId: string, uri: string | null) {
  const path = uri ? await uploadImage(uri, 'onlyus-avatars', userId) : null;
  const { error } = await getSupabaseClient().rpc('onlyus_set_avatar', { avatar_path: path });
  if (error) throw error;
  return path;
}
