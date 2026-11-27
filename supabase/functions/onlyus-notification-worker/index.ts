import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL') ?? ''; const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''; const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const authorization = request.headers.get('Authorization') ?? ''; const token = authorization.replace(/^Bearer\s+/i, ''); if (!token) return jsonResponse({ error: 'Authorization required' }, 401);
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const scheduler = token === serviceKey; let userId: string | null = null;
    if (!scheduler) { const auth = createClient(url, anon, { auth: { persistSession: false } }); const { data, error } = await auth.auth.getUser(token); if (error || !data.user) return jsonResponse({ error: 'Invalid session' }, 401); userId = data.user.id; }
    const now = new Date().toISOString();
    // Crash recovery: claims expire after five minutes, so processing jobs are retryable.
    let recovery = admin.from('notification_delivery_jobs').update({ status: 'pending' }).eq('status', 'processing').lte('available_at', now);
    if (!scheduler) { const { data: own, error } = await admin.from('notifications').select('id').eq('user_id', userId!).limit(1000); if (error) throw error; const ids = (own ?? []).map(row => row.id); if (!ids.length) return jsonResponse({ sent: 0 }); recovery = recovery.in('notification_id', ids); }
    const recovered = await recovery; if (recovered.error) throw recovered.error;
    let query = admin.from('notification_delivery_jobs').select('id,attempts,status,notification_id,notifications!inner(id,user_id,couple_id,type,title,body,payload)').eq('status', 'pending').lte('available_at', now).order('available_at').limit(50);
    if (!scheduler) query = query.eq('notifications.user_id', userId!);
    const { data: jobs, error: queryError } = await query; if (queryError) throw queryError;
    let sent = 0;
    for (const job of jobs ?? []) {
      const attempts = job.attempts + 1;
      const claim = await admin.from('notification_delivery_jobs').update({ status: 'processing', attempts, available_at: new Date(Date.now() + 300000).toISOString() }).eq('id', job.id).eq('status', 'pending').eq('attempts', job.attempts).select('id').maybeSingle(); if (claim.error) throw claim.error; if (!claim.data) continue;
      try {
        const raw = job.notifications; const notification = (Array.isArray(raw) ? raw[0] : raw) as { id: string; user_id: string; couple_id: string; type: string; title: string; body: string; payload: Record<string, unknown> };
        if (!notification) throw new Error('Notification was removed.');
        const [couple, membership, preference, tokens] = await Promise.all([
          admin.from('couples').select('status').eq('id', notification.couple_id).maybeSingle(),
          admin.from('couple_members').select('id').eq('couple_id', notification.couple_id).eq('user_id', notification.user_id).maybeSingle(),
          admin.from('notification_preferences').select('enabled').eq('user_id', notification.user_id).eq('type', notification.type).maybeSingle(),
          admin.from('push_tokens').select('token').eq('user_id', notification.user_id),
        ]); for (const result of [couple, membership, preference, tokens]) if (result.error) throw result.error;
        if (couple.data?.status !== 'active' || !membership.data || preference.data?.enabled === false) { const result = await admin.from('notification_delivery_jobs').update({ status: 'cancelled' }).eq('id', job.id); if (result.error) throw result.error; continue; }
        if (!tokens.data?.length) { const result = await admin.from('notification_delivery_jobs').update({ status: 'pending', attempts: job.attempts, available_at: new Date(Date.now() + 3600000).toISOString(), last_error: 'No registered push device' }).eq('id', job.id); if (result.error) throw result.error; continue; }
        const messages = tokens.data.map(row => ({ to: row.token, title: notification.title, body: notification.body, sound: 'default', channelId: 'onlyus', data: { type: notification.type, ...notification.payload } }));
        const abort = new AbortController(); const timeout = setTimeout(() => abort.abort(), 15000); let response: Response; try { response = await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(messages), signal: abort.signal }); } finally { clearTimeout(timeout); }
        const payload = await response.json(); if (!response.ok) throw new Error(`Expo Push: HTTP ${response.status}`); if (payload.errors?.length || !payload.data) throw new Error(`Expo Push: ${JSON.stringify(payload.errors ?? 'Missing push tickets')}`);
        const tickets = Array.isArray(payload.data) ? payload.data : [payload.data]; const errors: string[] = [];
        for (let index = 0; index < tickets.length; index++) { const ticket = tickets[index]; if (!ticket || !['ok', 'error'].includes(ticket.status)) throw new Error('Expo Push: malformed ticket'); if (ticket.status === 'error') { if (ticket.details?.error === 'DeviceNotRegistered') { const deleted = await admin.from('push_tokens').delete().eq('token', tokens.data[index]?.token); if (deleted.error) throw deleted.error; } else errors.push(ticket.message || 'Push rejected'); } }
        if (errors.length) throw new Error(`Expo Push: ${errors.join('; ')}`);
        const result = await admin.from('notification_delivery_jobs').update({ status: 'sent', last_error: null }).eq('id', job.id); if (result.error) throw result.error; sent++;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown notification delivery error'; console.error('OnlyUS push job failed', job.id, message);
        const result = await admin.from('notification_delivery_jobs').update({ status: attempts >= 5 ? 'failed' : 'pending', available_at: new Date(Date.now() + Math.min(3600, 30 * 2 ** attempts) * 1000).toISOString(), last_error: message.slice(0, 2000) }).eq('id', job.id); if (result.error) throw result.error;
      }
    }
    return jsonResponse({ sent, processed: jobs?.length ?? 0 });
  } catch (err) { console.error('OnlyUS notification worker:', err instanceof Error ? err.message : 'Unknown error'); return jsonResponse({ error: err instanceof Error ? err.message : 'Notification delivery failed' }, 500); }
});
