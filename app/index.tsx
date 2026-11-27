import { Redirect } from 'expo-router';
import { useOnlyus } from '@/hooks/useOnlyus';
import { LoadingScreen } from '@/components/layout/Screen';
export function AuthRouter() { const { session, initialized, accountLoading } = useOnlyus(); if (!initialized || (session && accountLoading)) return <LoadingScreen />; return <Redirect href={session ? '/(tabs)' : '/login'} />; }
export default AuthRouter;
