// Glue untuk headless task SDK Android; pengambilan data tetap di services/.
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { OnlyusWidget } from '@/components/widgets/OnlyusWidget';
import { loadWidgetDrawing } from '@/services/widgetService';
import { widgetLibrary } from '@/services/widgetPlatformService';
let registered = false;
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) { if (props.widgetAction === 'WIDGET_DELETED') return; try { const drawing = await loadWidgetDrawing(); props.renderWidget(<OnlyusWidget svg={drawing.svg} caption={drawing.caption} size={props.widgetInfo.widgetName === 'OnlyusSmall' ? 104 : 176} />); } catch { props.renderWidget(<OnlyusWidget svg={null} caption="Buka OnlyUS untuk menyinkronkan gambar." size={104} />); } }
export function registerOnlyusWidgets() { const library = widgetLibrary(); if (!library || registered) return; library.registerWidgetTaskHandler(widgetTaskHandler); registered = true; }
