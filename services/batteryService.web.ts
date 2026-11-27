// Do not collect browser battery data or load a native battery module.
export async function getSharedBatteryLevel(): Promise<number> { return -1; }
