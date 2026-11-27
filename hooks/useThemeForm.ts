import { useMemo, useState } from 'react';
import { ThemeName, hexPattern, resolvePalette } from '@/constants/theme';
import { useOnlyus } from './useOnlyus';
export function useThemeForm() {
  const account = useOnlyus();
  const [selected, setSelected] = useState<ThemeName>(account.theme.theme_name);
  const [custom, setCustom] = useState<Record<string, string>>({ primary: account.theme.custom_colors.primary || account.colors.primary, secondary: account.theme.custom_colors.secondary || account.colors.secondary, background: account.theme.custom_colors.background || account.colors.background, button: account.theme.custom_colors.button || account.colors.button });
  const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const preview = useMemo(() => resolvePalette(selected, custom), [selected, custom]);
  const select = (name: ThemeName) => { setSelected(name); setMessage(''); setError(''); };
  const updateColor = (key: string, value: string) => { setCustom(old => ({ ...old, [key]: value })); setMessage(''); };
  const apply = async () => { setError(''); setMessage(''); if (selected === 'custom' && Object.values(custom).some(value => !hexPattern.test(value))) { setError('Semua warna harus menggunakan format HEX #RRGGBB.'); return; } if (await account.applyTheme({ theme_name: selected, custom_colors: selected === 'custom' ? custom : account.theme.custom_colors })) setMessage('Tema diterapkan dan tersimpan untuk akunmu.'); };
  return { ...account, selected, select, custom, updateColor, preview, formError: error, message, apply };
}
