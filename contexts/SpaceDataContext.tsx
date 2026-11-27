import { createContext, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useOnlyus } from '@/hooks/useOnlyus';
import { useDeviceMediaSession } from '@/hooks/useDeviceMediaSession';
import { emptySpaceData, loadSpaceData, sendLove, newRequestId, SpaceData, LocationRow, locationMode, setFavorite, reactMemory, deleteContent, receiveDrawing, markNotification, saveNotificationPreference } from '@/services/spaceDataService';
import { getSupabaseClient } from '@/services/supabase';
import { loadLocal, saveLocal } from '@/services/localStateService';
import { errorMessage } from '@/services/errorService';
interface SpaceState extends SpaceData, ReturnType<typeof useDeviceMediaSession> {
  ready: boolean; loading: boolean; busy: boolean; error: string; pendingLoves: number; sync: string;
  refreshData: () => Promise<void>; execute: (action: () => Promise<void>) => Promise<boolean>;
  send: () => Promise<void>; retryLoves: () => Promise<void>;
  changeLocationMode: (mode: LocationRow['sharing_mode'], history: boolean, battery: boolean) => Promise<boolean>;
  favorite: (kind: 'artwork' | 'memory', id: string) => Promise<boolean>; react: (id: string) => Promise<boolean>;
  remove: (table: 'memories' | 'artworks' | 'drawings', id: string) => Promise<boolean>; receive: (id: string) => Promise<boolean>;
  read: (id: string) => Promise<boolean>; preference: (type: string, enabled: boolean) => Promise<boolean>;
}
export const SpaceDataContext = createContext<SpaceState | undefined>(undefined);
export function SpaceDataProvider({ children }: { children: ReactNode }) {
  const account = useOnlyus();
  const userId = account.session?.user.id ?? '';
  const spaceId = account.space?.status === 'active' ? account.space.id : '';
  const scope = userId && spaceId ? `${userId}:${spaceId}` : '';
  const media = useDeviceMediaSession(scope);
  const [data, setData] = useState<SpaceData>(emptySpaceData);
  const [loadedScope, setLoadedScope] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sync, setSync] = useState('Menghubungkan');
  const [pendingLoves, setPendingLoves] = useState(0);
  const generation = useRef(0);
  const currentScope = useRef(scope); currentScope.current = scope;
  const actionLock = useRef(false);
  const queue = useRef<string[]>([]);
  const pumpingScope = useRef<string | null>(null);
  const storageChain = useRef<Promise<unknown>>(Promise.resolve());
  const hydration = useRef<Promise<void>>(Promise.resolve());
  const refreshData = useCallback(async () => {
    if (!scope) return;
    const sequence = ++generation.current;
    try {
      const next = await loadSpaceData(spaceId, userId);
      if (currentScope.current === scope && sequence === generation.current) { setData(next); setLoadedScope(scope); }
    } catch (err) {
      if (currentScope.current === scope && sequence === generation.current) { setError(errorMessage(err)); setSync('Jaringan perlu diperiksa'); }
    } finally { if (currentScope.current === scope && sequence === generation.current) setLoading(false); }
  }, [scope, spaceId, userId]);
  const persistQueue = useCallback((snapshot: string[]) => {
    storageChain.current = storageChain.current.catch(() => undefined).then(() => saveLocal(`love:${scope}`, snapshot));
    return storageChain.current;
  }, [scope]);
  const retryLoves = useCallback(async () => {
    if (!scope || pumpingScope.current === scope) return;
    pumpingScope.current = scope;
    try {
      await hydration.current; await storageChain.current;
      while (queue.current.length && currentScope.current === scope) {
        const key = queue.current[0];
        const summary = await sendLove(spaceId, key);
        if (currentScope.current !== scope) return;
        generation.current++;
        setData(previous => ({ ...previous, love: summary })); setLoadedScope(scope);
        queue.current = queue.current.filter(item => item !== key);
        setPendingLoves(queue.current.length);
        await persistQueue([...queue.current]); setError('');
      }
      if (currentScope.current === scope) void refreshData();
    } catch (err) { if (currentScope.current === scope) setError(`${errorMessage(err)} Love menunggu pengiriman; coba kembali dengan kunci yang sama.`); }
    finally { if (pumpingScope.current === scope) pumpingScope.current = null; }
  }, [scope, spaceId, persistQueue, refreshData]);
  const send = useCallback(async () => {
    if (!scope) return;
    try {
      await hydration.current; if (currentScope.current !== scope) return;
      if (queue.current.length >= 100) { setError('Ada 100 Love menunggu. Kirim ulang antrean terlebih dahulu.'); return; }
      queue.current.push(newRequestId()); setPendingLoves(queue.current.length);
      await persistQueue([...queue.current]); await retryLoves();
    } catch (err) { if (currentScope.current === scope) setError(errorMessage(err)); }
  }, [scope, persistQueue, retryLoves]);
  useEffect(() => {
    generation.current++; setData(emptySpaceData()); setLoadedScope(''); setError(''); setSync('Menghubungkan');
    queue.current = []; setPendingLoves(0); setLoading(Boolean(scope));
    if (!scope) { hydration.current = Promise.resolve(); return; }
    let alive = true;
    void refreshData();
    hydration.current = loadLocal<string[]>(`love:${scope}`, []).then(keys => {
      if (!alive) return;
      queue.current = Array.from(new Set(keys.filter(key => /^[a-f0-9-]{36}$/.test(key))));
      setPendingLoves(queue.current.length);
    }).catch(err => { if (alive) setError(errorMessage(err)); });
    void hydration.current.then(() => { if (alive && queue.current.length) void retryLoves(); });
    const timer = setInterval(() => { if (AppState.currentState === 'active') { void refreshData(); if (queue.current.length) void retryLoves(); } }, 30000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') { void refreshData(); void retryLoves(); } });
    return () => { alive = false; generation.current++; clearInterval(timer); listener.remove(); };
  }, [scope, refreshData, retryLoves]);
  useEffect(() => {
    if (!scope) return;
    const client = getSupabaseClient(); let alive = true; let debounce: ReturnType<typeof setTimeout> | null = null;
    const changed = () => { if (debounce) clearTimeout(debounce); debounce = setTimeout(() => { if (alive) void refreshData(); }, 180); };
    const channel = client.channel(`space-data:${scope}`);
    for (const table of ['artworks', 'memories', 'drawings', 'love_events', 'location_sharing', 'memory_reactions', 'artwork_favorites', 'memory_favorites']) {
      channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table, filter: `couple_id=eq.${spaceId}` }, changed);
      channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table, filter: `couple_id=eq.${spaceId}` }, changed);
      channel.on('postgres_changes', { event: 'DELETE', schema: 'public', table }, changed);
    }
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, changed)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, changed)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notification_preferences', filter: `user_id=eq.${userId}` }, changed)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notification_preferences', filter: `user_id=eq.${userId}` }, changed)
      .subscribe(status => { if (!alive) return; if (status === 'SUBSCRIBED') setSync('Realtime terhubung'); else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setSync('Sinkronisasi berkala · 30 detik'); });
    return () => { alive = false; if (debounce) clearTimeout(debounce); void client.removeChannel(channel); };
  }, [scope, spaceId, userId, refreshData]);
  useEffect(() => { if (loadedScope === scope && media.activeArtwork && !data.artworks.some(row => row.id === media.activeArtwork?.id)) media.stopMedia(); }, [loadedScope, scope, data.artworks, media.activeArtwork?.id, media.stopMedia]);
  const execute = useCallback(async (action: () => Promise<void>) => {
    if (!scope || actionLock.current) return false;
    actionLock.current = true; setBusy(true); setError('');
    try { await action(); if (currentScope.current === scope) await refreshData(); return currentScope.current === scope; }
    catch (err) { if (currentScope.current === scope) setError(errorMessage(err)); return false; }
    finally { actionLock.current = false; setBusy(false); }
  }, [scope, refreshData]);
  const changeLocationMode = useCallback((mode: LocationRow['sharing_mode'], history: boolean, battery: boolean) => execute(async () => {
    const result = await locationMode(spaceId, mode, history, battery);
    if (currentScope.current === scope) { generation.current++; setData(previous => ({ ...previous, locations: [...previous.locations.filter(row => row.user_id !== userId), result.location], serverOffset: Date.parse(result.server_now) - Date.now() })); }
  }), [execute, scope, spaceId, userId]);
  const favorite = useCallback((kind: 'artwork' | 'memory', id: string) => execute(async () => {
    const enabled = !(kind === 'artwork' ? data.artworkFavorites : data.memoryFavorites).includes(id);
    await setFavorite(kind, id, spaceId, userId, enabled);
    if (currentScope.current === scope) setData(previous => { const field = kind === 'artwork' ? 'artworkFavorites' : 'memoryFavorites'; return { ...previous, [field]: enabled ? [...new Set([...previous[field], id])] : previous[field].filter(value => value !== id) }; });
  }), [execute, scope, spaceId, userId, data.artworkFavorites, data.memoryFavorites]);
  const react = useCallback((id: string) => execute(async () => {
    const enabled = !data.reactions.some(row => row.memory_id === id && row.user_id === userId);
    await reactMemory(id, spaceId, userId, enabled);
    if (currentScope.current === scope) setData(previous => ({ ...previous, reactions: [...previous.reactions.filter(row => !(row.memory_id === id && row.user_id === userId)), ...(enabled ? [{ memory_id: id, user_id: userId, reaction: 'heart' }] : [])] }));
  }), [execute, scope, spaceId, userId, data.reactions]);
  const remove = useCallback((table: 'memories' | 'artworks' | 'drawings', id: string) => execute(async () => {
    await deleteContent(table, id, userId);
    if (currentScope.current === scope) { setData(previous => ({ ...previous, [table]: previous[table].filter(row => row.id !== id) })); if (media.activeArtwork?.id === id) media.stopMedia(); }
  }), [execute, scope, userId, media.activeArtwork?.id, media.stopMedia]);
  const receive = useCallback((id: string) => execute(async () => {
    await receiveDrawing(id); if (currentScope.current === scope) setData(previous => ({ ...previous, drawings: previous.drawings.map(row => row.id === id ? { ...row, status: 'received' as const } : row) }));
  }), [execute, scope]);
  const read = useCallback((id: string) => execute(async () => { await markNotification(id); if (currentScope.current === scope) setData(previous => ({ ...previous, notifications: previous.notifications.map(row => row.id === id ? { ...row, is_read: true } : row) })); }), [execute, scope]);
  const preference = useCallback((type: string, enabled: boolean) => execute(async () => { await saveNotificationPreference(userId, type, enabled); if (currentScope.current === scope) setData(previous => ({ ...previous, preferences: { ...previous.preferences, [type]: enabled } })); }), [execute, scope, userId]);
  const scopedData = scope && loadedScope === scope ? data : emptySpaceData();
  return <SpaceDataContext.Provider value={{ ...scopedData, ...media, activeArtwork: scope && loadedScope === scope ? media.activeArtwork : null, ready: Boolean(scope), loading, busy, error, pendingLoves: scope ? pendingLoves : 0, sync, refreshData, execute, send, retryLoves, changeLocationMode, favorite, react, remove, receive, read, preference }}>{children}</SpaceDataContext.Provider>;
}
