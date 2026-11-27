import { useMemo } from 'react';
import { useOnlyus } from './useOnlyus';
import { daysTogether, greeting } from '@/services/dashboardService';
export function useDashboard() { const account = useOnlyus(); const days = useMemo(() => daysTogether(account.space?.together_since), [account.space?.together_since, account.profile]); return { ...account, days, greeting: greeting() }; }
