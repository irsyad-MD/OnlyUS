import { AccountGate } from '@/components/layout/AccountGate';
import { HomeScreen } from '@/components/feature/HomeScreen';
export function HomePage() { return <AccountGate><HomeScreen /></AccountGate>; }
export default HomePage;
