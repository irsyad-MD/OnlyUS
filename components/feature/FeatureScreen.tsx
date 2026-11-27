import { Redirect } from 'expo-router';
import { Screen, Heading } from '@/components/layout/Screen';
import { PhotoJournalScreen } from './PhotoJournalScreen';
import { LoveScreen } from './LoveScreen';
import { MapsScreen } from './MapsScreen';
import { DrawingScreen } from './DrawingScreen';
interface FeatureScreenProps { featureId: string; tab?: boolean; }
export function FeatureScreen({ featureId, tab = false }: FeatureScreenProps) { if (featureId === 'artwork') return <PhotoJournalScreen kind="artwork" tab={tab} />; if (featureId === 'memories') return <PhotoJournalScreen kind="memory" tab={tab} />; if (featureId === 'love') return <LoveScreen tab={tab} />; if (featureId === 'maps') return <MapsScreen tab={tab} />; if (featureId === 'widget') return <DrawingScreen tab={tab} />; if (featureId === 'connection') return <Redirect href="/space" />; return <Screen tab={tab}><Heading title="Halaman tidak ditemukan" subtitle="Gunakan navigasi untuk kembali ke ruang kalian." /></Screen>; }
