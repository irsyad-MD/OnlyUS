import type { ConfigContext, ExpoConfig } from 'expo/config';
export function createExpoConfig({ config }: ConfigContext): ExpoConfig { const mapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY; return { ...config, name: config.name ?? 'OnlyUS', slug: config.slug ?? 'onlyus', android: { ...config.android, ...(mapsKey ? { config: { ...config.android?.config, googleMaps: { apiKey: mapsKey } } } : {}) } }; }
export default createExpoConfig;
