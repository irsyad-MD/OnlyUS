import { ReactNode } from 'react';
import { useOnlyus } from '@/hooks/useOnlyus';
import { LoadingScreen } from './Screen';
import { LoginScreen } from '@/components/feature/LoginScreen';
export function AccountGate({ children }: { children: ReactNode }) { const { initialized, session, accountLoading } = useOnlyus(); if (!initialized || (session && accountLoading)) return <LoadingScreen />; if (!session) return <LoginScreen />; return <>{children}</>; }
