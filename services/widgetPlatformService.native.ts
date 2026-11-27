import { Platform } from 'react-native';
import Constants from 'expo-constants';
export function widgetLibrary(): typeof import('react-native-android-widget') | null { if (Platform.OS !== 'android' || Constants.appOwnership === 'expo') return null; try { return require('react-native-android-widget'); } catch { return null; } }
export async function installedWidgetCount() { const library = widgetLibrary(); if (!library) throw new Error('Modul widget belum tersedia pada platform/build ini.'); const [small, medium] = await Promise.all([library.getWidgetInfo('OnlyusSmall'), library.getWidgetInfo('OnlyusMedium')]); return small.length + medium.length; }
