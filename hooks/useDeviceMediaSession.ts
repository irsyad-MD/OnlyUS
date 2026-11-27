import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useVideoPlayer } from 'expo-video';
import { Artwork } from '@/services/spaceDataService';
import { pickSessionVideo, cacheArtwork } from '@/services/mediaSessionService';
import { errorMessage } from '@/services/errorService';
import { loadLocal, saveLocal } from '@/services/localStateService';
export function useDeviceMediaSession(scope: string) {
  const player = useVideoPlayer(null, instance => { instance.staysActiveInBackground = true; instance.audioMixingMode = 'doNotMix'; });
  const generation = useRef(0); const lock = useRef(false);
  const [video, setVideo] = useState<string | null>(null); const [activeArtwork, setActiveArtwork] = useState<Artwork | null>(null); const [playing, setPlaying] = useState(false); const [mediaError, setMediaError] = useState(''); const [mediaBusy, setMediaBusy] = useState(false);
  useEffect(() => { generation.current++; let alive = true; player.pause(); player.showNowPlayingNotification = false; setActiveArtwork(null); setVideo(null); setMediaError(''); if (scope) void loadLocal<string | null>(`video:${scope}`, null).then(value => { if (alive && Platform.OS !== 'web') setVideo(value); }).catch(err => { if (alive) setMediaError(errorMessage(err)); }); return () => { alive = false; generation.current++; try { player.pause(); player.showNowPlayingNotification = false; } catch { /* Player may already be released on root unmount. */ } }; }, [scope, player]);
  useEffect(() => { const playingListener = player.addListener('playingChange', event => setPlaying(event.isPlaying)); const statusListener = player.addListener('statusChange', event => { if (event.status === 'error') setMediaError(event.error?.message ?? 'Video tidak dapat diputar. Pilih video lain.'); }); return () => { playingListener.remove(); statusListener.remove(); }; }, [player]);
  const chooseVideo = useCallback(async () => { if (lock.current) return; lock.current = true; const sequence = generation.current; setMediaBusy(true); setMediaError(''); try { const uri = await pickSessionVideo(); if (uri && sequence === generation.current) { setVideo(uri); if (Platform.OS !== 'web') await saveLocal(`video:${scope}`, uri); } } catch (err) { setMediaError(errorMessage(err)); } finally { lock.current = false; setMediaBusy(false); } }, [scope]);
  const activateArtwork = useCallback(async (artwork: Artwork) => { if (lock.current) return; lock.current = true; const sequence = generation.current; setMediaBusy(true); setMediaError(''); try { if (!video) throw new Error('Pilih video milikmu sebagai sesi media nyata terlebih dahulu. Tidak ada audio diam atau sesi palsu.'); if (!artwork.uri) throw new Error('Foto artwork belum dapat diakses. Sinkronkan ulang.'); const image = await cacheArtwork(artwork.uri); if (sequence !== generation.current) return; await player.replaceAsync({ uri: video, metadata: { title: artwork.title, artist: artwork.description || 'OnlyUS', artwork: image } }); if (sequence !== generation.current) { player.pause(); player.showNowPlayingNotification = false; return; } player.showNowPlayingNotification = Platform.OS !== 'web'; player.play(); setActiveArtwork(artwork); } catch (err) { setMediaError(errorMessage(err)); } finally { lock.current = false; setMediaBusy(false); } }, [video, player]);
  const stopMedia = useCallback(() => { generation.current++; player.pause(); player.showNowPlayingNotification = false; setActiveArtwork(null); }, [player]);
  const toggleMedia = useCallback(() => { if (player.playing) player.pause(); else player.play(); }, [player]);
  return { player, video, activeArtwork, playing, mediaError, mediaBusy, chooseVideo, activateArtwork, stopMedia, toggleMedia };
}
