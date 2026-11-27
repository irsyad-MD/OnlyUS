import { getSupabaseClient } from './supabase';
export type AuthMode = 'login' | 'signup' | 'reset' | 'verify' | 'password';
export async function submitAuth(mode: AuthMode, email: string, password: string, username: string, token: string) {
  const auth = getSupabaseClient().auth;
  if (mode !== 'password' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error('Masukkan alamat email yang valid.');
  if (['login', 'signup', 'password'].includes(mode) && password.length < (mode === 'login' ? 1 : 8)) throw new Error('Kata sandi baru minimal 8 karakter.');
  if (mode === 'signup' && (!username.trim() || username.trim().length > 60)) throw new Error('Nama wajib diisi, maksimal 60 karakter.');
  if (mode === 'login') { const { error } = await auth.signInWithPassword({ email: email.trim(), password }); if (error) throw error; return { next: mode, message: '', signedIn: true }; }
  if (mode === 'signup') { const { data, error } = await auth.signUp({ email: email.trim(), password, options: { data: { username: username.trim() } } }); if (error) throw error; return { next: 'login' as AuthMode, message: data.session ? '' : 'Periksa email untuk konfirmasi akun, kemudian masuk.', signedIn: Boolean(data.session) }; }
  if (mode === 'reset') { const { error } = await auth.resetPasswordForEmail(email.trim()); if (error) throw error; return { next: 'verify' as AuthMode, message: 'Email pemulihan dikirim. Masukkan kode token dari email; template Supabase harus menyertakan {{ .Token }}.', signedIn: false }; }
  if (mode === 'verify') { if (!/^\d{6,10}$/.test(token.trim())) throw new Error('Masukkan kode numerik pemulihan dari email.'); const { error } = await auth.verifyOtp({ email: email.trim(), token: token.trim(), type: 'recovery' }); if (error) throw error; return { next: 'password' as AuthMode, message: 'Identitas terverifikasi. Buat kata sandi baru.', signedIn: false }; }
  const { error } = await auth.updateUser({ password }); if (error) throw error; return { next: 'login' as AuthMode, message: 'Kata sandi diperbarui.', signedIn: true };
}
