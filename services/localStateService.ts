import AsyncStorage from '@react-native-async-storage/async-storage';
export async function loadLocal<T>(key: string, fallback: T): Promise<T> { const value = await AsyncStorage.getItem(`onlyus:${key}`); if (!value) return fallback; try { return JSON.parse(value) as T; } catch { return fallback; } }
export async function saveLocal(key: string, value: unknown) { await AsyncStorage.setItem(`onlyus:${key}`, JSON.stringify(value)); }
export async function removeLocal(key: string) { await AsyncStorage.removeItem(`onlyus:${key}`); }
