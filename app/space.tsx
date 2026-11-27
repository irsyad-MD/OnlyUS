import { AccountGate } from '@/components/layout/AccountGate';
import { SpaceScreen } from '@/components/feature/SpaceScreen';
export function SpacePage() { return <AccountGate><SpaceScreen /></AccountGate>; }
export default SpacePage;
