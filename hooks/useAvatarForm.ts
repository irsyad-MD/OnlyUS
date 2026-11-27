import { useCallback, useState } from 'react';
import { useOnlyus } from './useOnlyus';
import { pickPhoto } from '@/services/mediaService';
import { errorMessage } from '@/services/errorService';
export function useAvatarForm() { const account = useOnlyus(); const [picking, setPicking] = useState(false); const [message, setMessage] = useState(''); const [success, setSuccess] = useState(false); const [confirmRemove, setConfirmRemove] = useState(false);
  const choose = useCallback(async (camera: boolean) => { setPicking(true); setMessage(''); setSuccess(false); try { const photo = await pickPhoto(camera); if (photo && await account.updateAvatar(photo.uri)) { setMessage('Foto profil tersimpan dan dibagikan hanya kepada pasangan aktif.'); setSuccess(true); } } catch (err) { setMessage(errorMessage(err)); } finally { setPicking(false); } }, [account.updateAvatar]);
  const remove = useCallback(async () => { if (await account.updateAvatar(null)) { setConfirmRemove(false); setMessage('Foto profil dihapus dari profil.'); setSuccess(true); } }, [account.updateAvatar]);
  return { ...account, picking, message, success, confirmRemove, setConfirmRemove, choose, remove };
}
