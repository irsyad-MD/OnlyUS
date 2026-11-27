// Safe fallback for tooling; device builds select batteryService.native.ts.
export async function getSharedBatteryLevel(): Promise<number> { return -1; }
