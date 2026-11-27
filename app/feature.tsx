import { useLocalSearchParams } from 'expo-router';
import { AccountGate } from '@/components/layout/AccountGate';
import { FeatureScreen } from '@/components/feature/FeatureScreen';
export function FeaturePage() { const { id } = useLocalSearchParams<{ id?: string | string[] }>(); return <AccountGate><FeatureScreen featureId={Array.isArray(id) ? id[0] : id ?? ''} /></AccountGate>; }
export default FeaturePage;
