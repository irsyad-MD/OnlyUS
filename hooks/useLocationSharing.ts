import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useOnlyus } from './useOnlyus';
import { useSpaceData } from './useSpaceData';
import { requestLocationPermission, watchSharedLocation, locationDuration, locationStatus } from '@/services/locationService';
import { errorMessage } from '@/services/errorService';
import { LocationRow } from '@/services/spaceDataService';
export function useLocationTracker() {
  const { space, session } = useOnlyus(); const state = useSpaceData(); const own = state.locations.find(row => row.user_id === session?.user.id); const [gpsError, setGpsError] = useState('');
  useEffect(() => { let alive = true; let stop: (() => void) | null = null; let run = 0;
    const start = async () => { const sequence = ++run; stop?.(); stop = null; if (!alive || !space || space.status !== 'active' || own?.sharing_mode !== 'live' || AppState.currentState !== 'active') return;
      try { await requestLocationPermission(); const unsubscribe = await watchSharedLocation(space.id, Boolean(own.battery_consent), message => { if (alive) setGpsError(message); }); if (!alive || sequence !== run) unsubscribe(); else stop = unsubscribe; } catch (err) { if (alive) setGpsError(errorMessage(err)); }
    };
    void start(); const listener = AppState.addEventListener('change', status => { if (status === 'active') void start(); else { run++; stop?.(); stop = null; } }); return () => { alive = false; run++; stop?.(); listener.remove(); };
  }, [space?.id, space?.status, own?.sharing_mode, own?.battery_consent]);
  return gpsError;
}
export function useLocationSharing() {
  const account = useOnlyus(); const state = useSpaceData(); const own = state.locations.find(row => row.user_id === account.session?.user.id); const partner = state.locations.find(row => row.user_id === account.space?.partner?.id);
  const [history, setHistory] = useState(own?.history_enabled ?? false); const [battery, setBattery] = useState(own?.battery_consent ?? false); const [message, setMessage] = useState(''); const [now, setNow] = useState(Date.now());
  useEffect(() => { setHistory(own?.history_enabled ?? false); setBattery(own?.battery_consent ?? false); }, [own?.history_enabled, own?.battery_consent]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const changeMode = useCallback(async (mode: LocationRow['sharing_mode']) => { setMessage(''); try { if (mode === 'live') await requestLocationPermission(); await state.changeLocationMode(mode, history, battery); } catch (err) { setMessage(errorMessage(err)); } }, [history, battery, state.changeLocationMode]);
  const serverNow = now + (Number.isFinite(state.serverOffset) ? state.serverOffset : 0);
  return { ...account, ...state, own, partner, history, setHistory, battery, setBattery, message, changeMode, serverNow, duration: (row: LocationRow) => locationDuration(row.session_started_at, serverNow), status: (row: LocationRow) => locationStatus(row, serverNow) };
}
