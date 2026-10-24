import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { setPassword } from './actions';
import { PasswordInput } from '@/components/password-input';
export const dynamic='force-dynamic';
export default async function SetupPassword({searchParams}:{searchParams:Promise<{error?:string}>}){
  let verified=false;
  try {
    const supabase=await createSupabaseServerClient();
    const {data:{user},error}=await supabase.auth.getUser();
    verified=!error&&!!user;
  } catch { /* Provider unavailable */ }
  if(!verified) redirect('/login');
  const {error}=await searchParams;
  return <main className="auth-page"><section className="auth-card">
    <p className="eyebrow">MASAJIDALLOH PRO</p><h1>Atur kata sandi akun</h1>
    <p>Buat kata sandi baru untuk mengakses dashboard pengurus. Minimal 12 karakter.</p>
    {error&&<p role="alert" className="error">{error==='invalid'?'Password minimal 12 karakter dan harus cocok.':'Pengaturan password gagal. Silakan coba lagi.'}</p>}
    <form className="auth-form" action={setPassword}>
      <label htmlFor="password">Kata sandi baru</label><PasswordInput id="password" name="password" autoComplete="new-password" minLength={12} maxLength={128} required/>
      <label htmlFor="confirmation">Ulangi kata sandi</label><PasswordInput id="confirmation" name="confirmation" autoComplete="new-password" minLength={12} maxLength={128} required/>
      <button type="submit">Simpan password</button>
    </form>
    <p className="helper">Jangan bagikan password atau tautan undangan kepada siapa pun.</p><Link href="/dashboard">Kembali ke dashboard</Link>
  </section></main>;
}
