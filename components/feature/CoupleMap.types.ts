import { LocationRow } from '@/services/spaceDataService';
export interface CoupleMapProps { locations: LocationRow[]; names: Record<string, string>; focus: string | null; zoom: number; }
