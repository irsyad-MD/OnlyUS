import { createContext, ReactNode } from 'react';
import { useLocationTracker } from '@/hooks/useLocationSharing';
export const GpsStatusContext = createContext('');
export function GpsStatusProvider({ children }: { children: ReactNode }) { const status = useLocationTracker(); return <GpsStatusContext.Provider value={status}>{children}</GpsStatusContext.Provider>; }
