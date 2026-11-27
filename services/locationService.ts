import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { getSharedBatteryLevel } from './batteryService';
import { getSupabaseClient } from './supabase';
export async function requestLocationPermission() { const result = await Location.requestForegroundPermissionsAsync(); if (!result.granted) throw new Error('Izin lokasi diperlukan. Aktifkan melalui Pengaturan perangkat.'); return result.status; }
export async function watchSharedLocation(spaceId: string, batteryConsent: boolean, onError: (message: string) => void): Promise<() => void> {
  let alive = true; let sending = false; let label = ''; let lastGeocode = 0;
  const subscription = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 15 }, async position => {
    if (!alive || sending) return;
    const { latitude, longitude, accuracy } = position.coords;
    if (accuracy == null || accuracy > 100) { onError('Akurasi GPS belum memadai (maksimum 100 m). Menunggu sinyal lebih baik.'); return; }
    sending = true;
    try {
      if (Platform.OS !== 'web' && Date.now() - lastGeocode > 60000) {
        lastGeocode = Date.now(); try { const places = await Location.reverseGeocodeAsync({ latitude, longitude }); const place = places[0]; label = place ? [place.name, place.district, place.city].filter(Boolean).join(', ') : ''; } catch { label = ''; }
      }
      const level = batteryConsent && Platform.OS !== 'web' ? await getSharedBatteryLevel() : -1;
      if (!alive) return;
      const { error } = await getSupabaseClient().rpc('onlyus_update_location', { space_id: spaceId, lat: latitude, lng: longitude, gps_accuracy: accuracy, place_label: label, battery: level >= 0 ? Math.round(level * 100) : null }); if (error) throw error;
      onError('');
    } catch (err) { onError(err instanceof Error ? err.message : String((err as { message?: string })?.message ?? 'Pembaruan GPS gagal.')); }
    finally { sending = false; }
  });
  return () => { alive = false; subscription.remove(); };
}
export function locationDuration(start: string | null, now: number) { if (!start) return 'Belum ada sesi'; const seconds = Math.max(0, Math.floor((now - Date.parse(start)) / 1000)); const days = Math.floor(seconds / 86400); const hours = Math.floor(seconds / 3600) % 24; const minutes = Math.floor(seconds / 60) % 60; return `${days ? `${days} hari ` : ''}${hours} jam ${minutes} menit`; }
export function locationStatus(row: { sharing_mode: string; coordinates_verified_at: string | null }, now: number) { if (row.sharing_mode === 'off') return 'Berbagi lokasi nonaktif'; if (row.sharing_mode === 'stealth') return 'Mode Penyamaran Aktif · lokasi terakhir'; if (!row.coordinates_verified_at) return 'Menunggu GPS pertama'; return now - Date.parse(row.coordinates_verified_at) > 60000 ? 'Lokasi terakhir · tidak terverifikasi terkini' : 'GPS diperbarui dalam 1 menit terakhir'; }
