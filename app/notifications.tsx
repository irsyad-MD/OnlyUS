import { AccountGate } from '@/components/layout/AccountGate';
import { NotificationsScreen } from '@/components/feature/NotificationsScreen';
export function NotificationsPage() { return <AccountGate><NotificationsScreen /></AccountGate>; }
export default NotificationsPage;
