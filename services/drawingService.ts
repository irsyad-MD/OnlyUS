import { Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from './fileSystemService';
import { Stroke } from './spaceDataService';
import { drawingPaper } from '@/constants/theme';
export function normalizeStrokes(value: unknown): Stroke[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 300).filter(stroke => stroke && typeof stroke.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(stroke.color) && Number.isFinite(stroke.width) && stroke.width >= 1 && stroke.width <= 32 && Array.isArray(stroke.points)).map(stroke => ({ color: stroke.color as string, width: stroke.width as number, points: stroke.points.slice(0, 1201).filter((point: { x: number; y: number } | null) => point && Number.isFinite(point.x) && Number.isFinite(point.y) && point.x >= 0 && point.x <= 300 && point.y >= 0 && point.y <= 300).map((point: { x: number; y: number }) => ({ x: point.x, y: point.y })) })).filter(stroke => stroke.points.length >= 2);
}
export function drawingSvg(strokes: Stroke[]): string { const paths = normalizeStrokes(strokes).map(stroke => { const path = stroke.points.map((point, index) => `${index ? 'L' : 'M'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' '); return `<path d="${path}" stroke="${stroke.color}" stroke-width="${stroke.width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`; }).join(''); return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 300 300"><rect width="300" height="300" fill="${drawingPaper}"/>${paths}</svg>`; }
export async function saveDrawingToGallery(uri: string) { if (Platform.OS === 'web') { if (!await Sharing.isAvailableAsync()) throw new Error('Penyimpanan galeri tidak tersedia di browser ini. Gunakan preview gambar atau aplikasi native.'); await Sharing.shareAsync(uri); return; } const permission = await MediaLibrary.requestPermissionsAsync(true); if (!permission.granted) throw new Error('Izin menyimpan gambar diperlukan.'); await MediaLibrary.saveToLibraryAsync(uri); }
export async function imageFromBase64(base64: string): Promise<string> { if (Platform.OS === 'web') return `data:image/png;base64,${base64}`; const path = `${FileSystem.cacheDirectory}onlyus-drawing-${Date.now()}.png`; await FileSystem.writeAsStringAsync(path, base64, { encoding: FileSystem.EncodingType.Base64 }); return path; }
