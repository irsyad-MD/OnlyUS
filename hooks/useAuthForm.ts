import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { AuthMode, submitAuth } from '@/services/authService';
import { errorMessage } from '@/services/errorService';
export function useAuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [username, setUsername] = useState(''); const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const lock = useRef(false);
  const changeMode = useCallback((next: AuthMode) => { setMode(next); setError(''); setMessage(''); setPassword(''); setToken(''); }, []);
  const submit = useCallback(async () => {
    if (lock.current) return; lock.current = true; setBusy(true); setError(''); setMessage('');
    try { const result = await submitAuth(mode, email, password, username, token); setMode(result.next); setMessage(result.message); setPassword(''); if (result.signedIn) router.replace('/'); }
    catch (err) { setError(errorMessage(err)); }
    finally { lock.current = false; setBusy(false); }
  }, [mode, email, password, username, token, router]);
  return { mode, changeMode, email, setEmail, password, setPassword, username, setUsername, token, setToken, busy, error, message, submit };
}
