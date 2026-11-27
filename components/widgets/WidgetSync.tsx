import { useEffect } from 'react';
import { useOnlyus } from '@/hooks/useOnlyus';
import { useSpaceData } from '@/hooks/useSpaceData';
import { drawingSvg } from '@/services/drawingService';
import { OnlyusWidget, widgetLibrary, registerOnlyusWidgets } from './OnlyusWidget';
export function WidgetSync() { const { space } = useOnlyus(); const state = useSpaceData(); const latest = state.ready ? state.drawings.find(row => row.sender_id === space?.partner?.id) : null; useEffect(() => { const library = widgetLibrary(); if (!library) return; registerOnlyusWidgets(); for (const name of ['OnlyusSmall', 'OnlyusMedium']) { void library.requestWidgetUpdate({ widgetName: name, renderWidget: () => <OnlyusWidget svg={latest ? drawingSvg(latest.strokes) : null} caption={latest?.caption || (state.ready ? 'Belum ada gambar dari pasangan.' : 'Hubungkan pasangan di OnlyUS.')} size={name === 'OnlyusSmall' ? 104 : 176} /> }).catch(() => undefined); } }, [latest?.id, state.ready]); return null; }
