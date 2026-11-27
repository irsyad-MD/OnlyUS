import { AccountGate } from '@/components/layout/AccountGate';
import { SettingsScreen } from '@/components/feature/SettingsScreen';
export function SettingsPage() { return <AccountGate><SettingsScreen /></AccountGate>; }
export default SettingsPage;
