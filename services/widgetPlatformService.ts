// Type-checking fallback. Metro selects .native/.web/.ios per platform.
export function widgetLibrary(): typeof import('react-native-android-widget') | null { return null; }
export async function installedWidgetCount(): Promise<number> { throw new Error('Modul widget memerlukan build Android yang sesuai.'); }
