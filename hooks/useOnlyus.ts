import { useContext } from 'react';
import { OnlyusContext } from '@/contexts/OnlyusContext';
export function useOnlyus() { const value = useContext(OnlyusContext); if (!value) throw new Error('useOnlyus must be used within OnlyusProvider'); return value; }
