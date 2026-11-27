import { getSupabaseClient } from './supabase';
import { drawingSvg } from './drawingService';
import { Stroke } from './spaceDataService';
export async function loadWidgetDrawing(): Promise<{ svg: string | null; caption: string }> {
  const client = getSupabaseClient(); const { data: session, error: sessionError } = await client.auth.getSession(); if (sessionError) throw sessionError; if (!session.session) return { svg: null, caption: 'Masuk ke OnlyUS untuk melihat gambar.' };
  const { data: space, error } = await client.rpc('onlyus_get_space'); if (error) throw error; if (space?.status !== 'active' || !space.partner) return { svg: null, caption: 'Hubungkan pasangan di OnlyUS.' };
  const { data, error: drawingError } = await client.from('drawings').select('strokes,caption').eq('couple_id', space.id).eq('sender_id', space.partner.id).order('created_at', { ascending: false }).limit(1).maybeSingle(); if (drawingError) throw drawingError;
  return { svg: data ? drawingSvg(data.strokes as Stroke[]) : null, caption: data?.caption || 'Goresan untukmu' };
}
