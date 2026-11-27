import { AccountGate } from '@/components/layout/AccountGate';
import { FeatureScreen } from '@/components/feature/FeatureScreen';
export function LovePage() { return <AccountGate><FeatureScreen featureId="love" tab /></AccountGate>; }
export default LovePage;
