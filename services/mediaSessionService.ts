import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from './fileSystemService';
import * as Crypto from 'expo-crypto';
export async function pickSessionVideo(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync(); if (!permission.granted) throw new Error('Izin galeri diperlukan untuk memilih video sesi media.');
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 1 }); if (result.canceled || !result.assets[0]) return null;
  const uri = result.assets[0].uri; if (Platform.OS === 'web') return uri;
  const destination = `${FileSystem.documentDirectory}onlyus-session-${Crypto.randomUUID()}.mp4`; await FileSystem.copyAsync({ from: uri, to: destination }); return destination;
}
export async function cacheArtwork(uri: string) { if (Platform.OS === 'web') return uri; const path = `${FileSystem.cacheDirectory}onlyus-artwork-${Crypto.randomUUID()}.jpg`; const result = await FileSystem.downloadAsync(uri, path); if (result.status !== 200) throw new Error('Foto artwork tidak dapat disiapkan untuk sesi media.'); return result.uri; }
