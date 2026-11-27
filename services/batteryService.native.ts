import * as Battery from 'expo-battery';
export async function getSharedBatteryLevel(): Promise<number> { try { const level = await Battery.getBatteryLevelAsync(); return Number.isFinite(level) && level >= 0 && level <= 1 ? level : -1; } catch { return -1; } }
