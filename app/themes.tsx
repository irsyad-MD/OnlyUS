import { AccountGate } from '@/components/layout/AccountGate';
import { ThemeScreen } from '@/components/feature/ThemeScreen';
export function ThemesPage() { return <AccountGate><ThemeScreen /></AccountGate>; }
export default ThemesPage;
