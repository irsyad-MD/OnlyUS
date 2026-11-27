import { AccountGate } from '@/components/layout/AccountGate';
import { FeatureScreen } from '@/components/feature/FeatureScreen';
export function MemoriesPage() { return <AccountGate><FeatureScreen featureId="memories" tab /></AccountGate>; }
export default MemoriesPage;
