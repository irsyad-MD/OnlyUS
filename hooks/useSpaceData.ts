import { useContext } from 'react';
import { SpaceDataContext } from '@/contexts/SpaceDataContext';
export function useSpaceData() { const context = useContext(SpaceDataContext); if (!context) throw new Error('useSpaceData harus digunakan dalam SpaceDataProvider.'); return context; }
