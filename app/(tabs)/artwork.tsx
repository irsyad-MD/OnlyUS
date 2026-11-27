import { AccountGate } from '@/components/layout/AccountGate';
import { FeatureScreen } from '@/components/feature/FeatureScreen';
export function ArtworkPage() { return <AccountGate><FeatureScreen featureId="artwork" tab /></AccountGate>; }
export default ArtworkPage;
