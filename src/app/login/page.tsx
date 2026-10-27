import Link from 'next/link';
import Image from 'next/image';
import { login } from './actions';
import { PasswordInput } from '@/components/password-input';
export const dynamic = 'force-dynamic';
export default async function Login({searchParams}:{searchParams:Promise<{error?:string;next?:string}>}) {
  const {error,next} = await searchParams;const continuing=next==='daftar-masjid';
  return <main className="auth-page">
    <section className="auth-card">
      <Image className="official-logo auth-logo" src="/brand/logo.webp?v=3" alt="Logo resmi MASAJIDALLOH PRO" width={108} height={108} unoptimized />
      <p className="eyebrow">MASAJIDALLOH PRO</p>
      <h1>Masuk ke Dashboard Masjid</h1>
      <p>Professional Mosque Management Platform</p>
      {error && <div role="alert" className="error">
        {error === 'config' ? 'Konfigurasi layanan login belum tersedia. Hubungi administrator.' : 'Email atau kata sandi tidak valid.'}
      </div>}
      <form action={login} className="auth-form"><input type="hidden" name="next" value={continuing?'daftar-masjid':''}/>
        <label htmlFor="email">Email terdaftar</label>
        <input id="email" name="email" type="email" autoComplete="username" maxLength={254} required/>
        <label htmlFor="password">Kata sandi</label>
        <PasswordInput id="password" name="password" autoComplete="current-password" required/>
        <button type="submit">Masuk dengan aman</button>
      </form>
      <Link href="/forgot-password">Lupa kata sandi?</Link><p><Link href={continuing?'/buat-akun?next=daftar-masjid':'/buat-akun'}>Buat Akun Admin / Pembaca</Link></p>
      <p className="helper">Akun tenant diaktifkan setelah verifikasi administrator. Belum memiliki akun Masjid? <Link href="/paket">Lihat paket dan ajukan pendaftaran.</Link></p>
      <Link href="/">Kembali ke halaman utama</Link>
    </section>
  </main>;
}
