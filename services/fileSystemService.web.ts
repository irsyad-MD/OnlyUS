// Browser flows use fetch/Blob/data URIs and never native filesystem operations.
export const documentDirectory: string | null = null;
export const cacheDirectory: string | null = null;
export const EncodingType = { Base64: 'base64', UTF8: 'utf8' } as const;
export async function getInfoAsync(_uri: string) { return { exists: false, size: 0 }; }
export async function readAsStringAsync(_uri: string, _options?: { encoding?: string }): Promise<string> { throw new Error('Gunakan fetch untuk membaca file di browser.'); }
export async function writeAsStringAsync(_uri: string, _content: string, _options?: { encoding?: string }): Promise<void> { throw new Error('Gunakan data URI atau Blob untuk gambar di browser.'); }
export async function copyAsync(_options: { from: string; to: string }): Promise<void> { throw new Error('Penyalinan file native tidak tersedia di browser.'); }
export async function downloadAsync(_uri: string, _destination: string): Promise<{ status: number; uri: string }> { throw new Error('Gunakan URL gambar asli di browser.'); }
