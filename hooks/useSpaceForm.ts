import { useCallback, useState } from 'react';
import { Share } from 'react-native';
import { useOnlyus } from './useOnlyus';
export function useSpaceForm() {
  const account = useOnlyus(); const [code, setCode] = useState(''); const [date, setDate] = useState(''); const [confirm, setConfirm] = useState(false); const [message, setMessage] = useState('');
  const create = useCallback(async () => { setMessage(''); if (await account.create(date)) setMessage('Couple Space dibuat. Bagikan undangan ke pasanganmu.'); }, [account.create, date]);
  const join = useCallback(async () => { setMessage(''); if (await account.join(code)) { setCode(''); setMessage('Kalian terhubung dalam satu Couple Space.'); } }, [account.join, code]);
  const disconnect = useCallback(async () => { setMessage(''); if (await account.disconnect()) { setConfirm(false); setMessage('Koneksi diputus. Akses ruang bersama dicabut.'); } }, [account.disconnect]);
  const share = useCallback(async () => { if (!account.space) return; try { await Share.share({ message: `Gabung ke Couple Space OnlyUS-ku dengan kode ${account.space.couple_code}. Undangan berlaku sampai ${new Date(account.space.invite_expires_at).toLocaleDateString('id-ID')}.` }); } catch (err) { setMessage(err instanceof Error ? err.message : 'Tidak dapat membagikan undangan.'); } }, [account.space]);
  return { ...account, code, setCode, date, setDate, confirm, setConfirm, message, createSpace: create, joinSpace: join, disconnectSpace: disconnect, share };
}
