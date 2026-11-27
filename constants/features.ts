import { Feather } from '@expo/vector-icons';
export interface FeatureInfo { key: string; title: string; caption: string; icon: keyof typeof Feather.glyphMap; detail: string; requirement: string; }
export const features: FeatureInfo[] = [
  { key: 'artwork', title: 'I Love U', caption: 'Foto di sesi media', icon: 'image', detail: 'Artwork privat dan sesi video nyata.', requirement: 'Background lock screen memerlukan build native.' },
  { key: 'love', title: 'Love Me', caption: 'Satu sentuhan cinta', icon: 'heart', detail: 'Love tersimpan idempoten di server.', requirement: 'Couple Space aktif.' },
  { key: 'maps', title: 'Maps', caption: 'Dekat, dengan izin', icon: 'map-pin', detail: 'GPS transparan dan timer server.', requirement: 'Izin lokasi foreground; Android membutuhkan konfigurasi Google Maps SDK.' },
  { key: 'memories', title: 'OurDays', caption: 'Cerita yang tersimpan', icon: 'camera', detail: 'Jurnal privat dengan tanggal EXIF atau manual.', requirement: 'Couple Space aktif dan izin galeri/kamera.' },
  { key: 'widget', title: 'Our Widget', caption: 'Goresan untukmu', icon: 'edit-3', detail: 'Canvas dan pengiriman gambar privat.', requirement: 'Widget Android membutuhkan build native; iOS membutuhkan ekstensi WidgetKit.' },
];
