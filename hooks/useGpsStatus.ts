import { useContext } from 'react';
import { GpsStatusContext } from '@/contexts/GpsStatusContext';
export function useGpsStatus() { return useContext(GpsStatusContext); }
