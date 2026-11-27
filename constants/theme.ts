export const drawingColors = { pink: '#D95386', red: '#C63040', purple: '#7855A3', blue: '#286CBB', yellow: '#E9B62E', green: '#288B64', black: '#25222B', white: '#FFFFFF' };
export const drawingPaper = '#FFFFFF';
export const spacing = { xs: 8, sm: 16, md: 24, lg: 32, xl: 48 };
export const brandPhoto = 'https://cdn-ai.onspace.ai/onspace/files/C2QkkxshR5ydP4w2fLy9N9/selfie-time-1786887702720.jpg';
export interface Palette { primary: string; secondary: string; background: string; surface: string; text: string; subtle: string; border: string; button: string; onButton: string; danger: string; success: string; }
export type ThemeName = 'softPink' | 'midnightLove' | 'lavenderDream' | 'oceanLove' | 'creamAesthetic' | 'pureMinimalist' | 'custom';
export const themeNames: Record<ThemeName, string> = { softPink: 'Soft Pink', midnightLove: 'Midnight Love', lavenderDream: 'Lavender Dream', oceanLove: 'Ocean Love', creamAesthetic: 'Cream Aesthetic', pureMinimalist: 'Pure Minimalist', custom: 'Custom Theme' };
export const contrastText = (hex: string) => {
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const l = rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  return (l + .05) / .05 >= 1.05 / (l + .05) ? '#191622' : '#FFFFFF';
};
const make = (primary: string, secondary: string, background: string, surface: string, text: string, subtle: string, border: string): Palette => ({ primary, secondary, background, surface, text, subtle, border, button: primary, onButton: contrastText(primary), danger: text === '#FFF1F5' ? '#FF9AAF' : '#AF2848', success: text === '#FFF1F5' ? '#8CD8B0' : '#21694F' });
export const palettes: Record<Exclude<ThemeName, 'custom'>, Palette> = {
  softPink: make('#A73F60', '#F6D9E1', '#FFF2F2', '#FFF9F7', '#38252D', '#77545F', '#EACDD5'),
  midnightLove: make('#ED8DAC', '#3C2538', '#161420', '#25202F', '#FFF1F5', '#CDB6C4', '#514152'),
  lavenderDream: make('#765297', '#E9DDF4', '#F6F1FC', '#FEFAFF', '#33263E', '#735F83', '#DDD0E8'),
  oceanLove: make('#275F7D', '#D4E9EF', '#EDF7F9', '#F9FDFF', '#183343', '#536F7F', '#C7DEE5'),
  creamAesthetic: make('#79563B', '#EBDDC9', '#F8F1E7', '#FFFCF7', '#3B3028', '#756453', '#E3D4C1'),
  pureMinimalist: make('#262626', '#E8E6E2', '#F6F5F2', '#FFFFFF', '#242424', '#66615B', '#DDDAD4'),
};
export const hexPattern = /^#[0-9a-fA-F]{6}$/;
export function resolvePalette(name: ThemeName, custom: Record<string, string> = {}): Palette {
  if (name !== 'custom') return palettes[name] ?? palettes.softPink;
  const base = palettes.softPink;
  const valid = (key: string, fallback: string) => hexPattern.test(custom[key] ?? '') ? custom[key] : fallback;
  const background = valid('background', base.background);
  const surface = valid('secondary', base.surface);
  const text = contrastText(background);
  // Custom surfaces and backgrounds share a neutral accessible text color.
  return { ...base, primary: valid('primary', base.primary), secondary: surface, surface: background, background, text, subtle: text, border: valid('secondary', base.border), button: valid('button', base.button), onButton: contrastText(valid('button', base.button)) };
}
