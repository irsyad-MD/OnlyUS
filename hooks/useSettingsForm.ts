import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useOnlyus } from './useOnlyus';
export function useSettingsForm() { const account = useOnlyus(); const router = useRouter(); const [name, setName] = useState(account.profile?.username || ''); const [message, setMessage] = useState(''); const [confirm, setConfirm] = useState(false); useEffect(() => setName(account.profile?.username || ''), [account.profile?.username]); const save = async () => { setMessage(''); if (await account.updateName(name)) setMessage('Nama profil berhasil diperbarui.'); }; const logout = async () => { if (await account.signOut()) { setConfirm(false); router.replace('/'); } }; return { ...account, name, setName, message, save, logout, confirm, setConfirm }; }
