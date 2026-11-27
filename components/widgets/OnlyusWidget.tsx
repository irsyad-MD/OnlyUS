import { palettes, drawingPaper } from '@/constants/theme';
import { widgetLibrary } from '@/services/widgetPlatformService';
export { widgetLibrary } from '@/services/widgetPlatformService';
export { registerOnlyusWidgets } from '@/native/widgetTaskHandler';
interface OnlyusWidgetProps { svg: string | null; caption: string; size: number; }
export function OnlyusWidget({ svg, caption, size }: OnlyusWidgetProps) { const library = widgetLibrary(); if (!library) return null; const { FlexWidget, SvgWidget, TextWidget } = library; return <FlexWidget style={{ width: 'match_parent', height: 'match_parent', padding: 8, backgroundColor: drawingPaper, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }} clickAction="OPEN_APP">{svg ? <SvgWidget svg={svg} style={{ width: size, height: size }} /> : <TextWidget text="OnlyUS" style={{ fontSize: 26, fontWeight: 'bold', color: palettes.softPink.primary as `#${string}` }} />}<TextWidget text={caption} maxLines={2} style={{ fontSize: 14, color: palettes.softPink.text as `#${string}` }} /></FlexWidget>; }
