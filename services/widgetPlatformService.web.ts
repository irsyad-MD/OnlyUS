// Type-only references are erased; Android widget code is not bundled on web.
export function widgetLibrary(): typeof import('react-native-android-widget') | null { return null; }
export async function installedWidgetCount(): Promise<number> { throw new Error('Widget layar utama memerlukan build Android native, bukan browser.'); }
