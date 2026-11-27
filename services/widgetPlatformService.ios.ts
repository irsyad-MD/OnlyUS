// Android widget dependencies must not enter the iOS bundle.
export function widgetLibrary(): typeof import('react-native-android-widget') | null { return null; }
export async function installedWidgetCount(): Promise<number> { throw new Error('Widget iOS memerlukan ekstensi WidgetKit; modul Android tidak tersedia di iOS.'); }
