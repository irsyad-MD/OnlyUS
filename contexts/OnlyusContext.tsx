import { createContext, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { getSupabaseClient, isBackendConfigured } from '@/services/supabase';
import { CoupleSpace, Profile, ThemePreference, loadAccount, createSpace, joinSpace, disconnectSpace, saveTheme, saveProfile } from '@/services/onlyusService';
import { resolvePalette, Palette } from '@/constants/theme';
import { errorMessage } from '@/services/errorService';
import { setAvatar, clearImageCache } from '@/services/mediaService';
import { removePushTokens } from '@/services/notificationService';
interface OnlyusState {
  session: Session | null; initialized: boolean; accountLoading: boolean; configured: boolean; profile: Profile | null; space: CoupleSpace | null; theme: ThemePreference; colors: Palette; busy: boolean; error: string; syncStatus: string;
  updateAvatar: (uri: string | null) => Promise<boolean>; clearError: () => void; refresh: () => Promise<void>; create: (date: string) => Promise<boolean>; join: (code: string) => Promise<boolean>; disconnect: () => Promise<boolean>; applyTheme: (theme: ThemePreference) => Promise<boolean>; updateName: (name: string) => Promise<boolean>; signOut: () => Promise<boolean>;
}
export const OnlyusContext = createContext<OnlyusState | undefined>(undefined);
export function OnlyusProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [space, setSpace] = useState<CoupleSpace | null>(null);
  const [theme, setTheme] = useState<ThemePreference>({ theme_name: 'softPink', custom_colors: {} });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [syncStatus, setSyncStatus] = useState('Menghubungkan');
  const lock = useRef(false);
  const generation = useRef(0);
  const mounted = useRef(true);
  const configured = isBackendConfigured();
  const userId = session?.user.id;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!configured) { setInitialized(true); return; }
    const supabase = getSupabaseClient();
    let active = true;
    let receivedAuthEvent = false;
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { receivedAuthEvent = true; if (active) { setSession(next); setInitialized(true); } });
    void supabase.auth.getSession().then(({ data: result, error: authError }) => { if (active) { if (authError) setError(authError.message); if (!receivedAuthEvent) setSession(result.session); setInitialized(true); } }).catch(err => { if (active) { setError(errorMessage(err)); setInitialized(true); } });
    const listener = AppState.addEventListener('change', state => { if (state === 'active') supabase.auth.startAutoRefresh(); else supabase.auth.stopAutoRefresh(); });
    supabase.auth.startAutoRefresh();
    return () => { active = false; data.subscription.unsubscribe(); listener.remove(); supabase.auth.stopAutoRefresh(); };
  }, [configured]);
  const refresh = useCallback(async () => {
    if (!userId) return;
    const sequence = ++generation.current;
    try {
      const result = await loadAccount(userId);
      if (mounted.current && sequence === generation.current) { setProfile(result.profile); setSpace(result.space); setTheme(result.theme); setSyncStatus('Terhubung'); }
    } catch (err) { if (mounted.current && sequence === generation.current) { setError(errorMessage(err)); setSyncStatus('Perlu sinkronisasi ulang'); } }
    finally { if (mounted.current && sequence === generation.current) setAccountLoading(false); }
  }, [userId]);
  useEffect(() => {
    generation.current++;
    clearImageCache(); setProfile(null); setSpace(null); setError('');
    if (!userId) { setAccountLoading(false); setTheme({ theme_name: 'softPink', custom_colors: {} }); return; }
    setAccountLoading(true);
    void refresh();
    // Reconciliation also detects disconnects when RLS blocks the final event.
    const timer = setInterval(() => { if (!lock.current) void refresh(); }, 15000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active' && !lock.current) void refresh(); });
    return () => { generation.current++; clearInterval(timer); listener.remove(); };
  }, [userId, refresh]);
  useEffect(() => {
    if (!userId) return;
    const supabase = getSupabaseClient();
    let active = true;
    const channel = supabase.channel(`onlyus-${userId}-${space?.id ?? 'waiting'}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'themes', filter: `user_id=eq.${userId}` }, () => { if (!lock.current) void refresh(); });
    channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, () => { if (!lock.current) void refresh(); });
    if (space?.id) channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'couples', filter: `id=eq.${space.id}` }, () => { if (!lock.current) void refresh(); });
    channel.subscribe(status => { if (active && (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT')) setSyncStatus('Sinkronisasi berkala · 15 detik'); });
    return () => { active = false; void supabase.removeChannel(channel); };
  }, [userId, space?.id, refresh]);
  const run = useCallback(async (action: () => Promise<void>) => {
    if (lock.current) return false;
    lock.current = true; setBusy(true); setError('');
    try { await action(); return true; }
    catch (err) { if (mounted.current) setError(errorMessage(err)); return false; }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }, []);
  const create = useCallback((date: string) => run(async () => { await createSpace(date); await refresh(); }), [run, refresh]);
  const join = useCallback((code: string) => run(async () => { await joinSpace(code); await refresh(); }), [run, refresh]);
  const disconnect = useCallback(() => run(async () => { await disconnectSpace(); clearImageCache(); setSpace(null); await refresh(); }), [run, refresh]);
  const applyTheme = useCallback((next: ThemePreference) => run(async () => { if (!userId) throw new Error('Silakan masuk terlebih dahulu.'); generation.current++; await saveTheme(userId, next); setTheme(next); }), [run, userId]);
  const updateName = useCallback((name: string) => run(async () => { if (!userId) throw new Error('Silakan masuk terlebih dahulu.'); await saveProfile(userId, name); await refresh(); }), [run, userId, refresh]);
  const updateAvatar = useCallback((uri: string | null) => run(async () => { if (!userId) throw new Error('Silakan masuk terlebih dahulu.'); await setAvatar(userId, uri); clearImageCache(); await refresh(); }), [run, userId, refresh]);
  const signOut = useCallback(() => run(async () => { if (userId) await removePushTokens(userId); clearImageCache(); const { error: signoutError } = await getSupabaseClient().auth.signOut(); if (signoutError) throw signoutError; generation.current++; setSpace(null); setProfile(null); }), [run, userId]);
  const clearError = useCallback(() => setError(''), []);
  return <OnlyusContext.Provider value={{ session, initialized, configured, accountLoading: accountLoading || Boolean(session && !profile && !error), profile, space, theme, colors: resolvePalette(theme.theme_name, theme.custom_colors), busy, error, syncStatus, refresh, clearError, create, join, disconnect, applyTheme, updateName, updateAvatar, signOut }}>{children}</OnlyusContext.Provider>;
}
