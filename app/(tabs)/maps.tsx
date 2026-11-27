import { AccountGate } from '@/components/layout/AccountGate';
import { FeatureScreen } from '@/components/feature/FeatureScreen';
export function MapsPage() { return <AccountGate><FeatureScreen featureId="maps" tab /></AccountGate>; }
export default MapsPage;
