import Link from 'next/link';
import Image from 'next/image';
import { login } from './actions';
export const dynamic = 'force-dynamic';
export default async function Login({searchParams}:{searchParams:Promise<{error?:string}>}) {
  const {error} = await searchParams;
  return <main className="auth-page">
    <section className="auth-card">
      <Image className="official-logo auth-logo" src="/brand/logo.webp?v=2" alt="Logo resmi MASAJIDALLOH PRO" width={108} height={108} unoptimized />
      <p className="eyebrow">MASAJIDALLOH PRO</p>
      <h1>Masuk ke Dashboard Masjid</h1>
      <p>Professional Mosque Management Platform</p>
      {error && <div role="alert" className="error">
        {error === 'config' ? 'Konfigurasi layanan login belum tersedia. Hubungi administrator.' : 'Email atau kata sandi tidak valid.'}
      </div>}
      <form action={login} className="auth-form">
        <label htmlFor="email">Email terdaftar</label>
        <input id="email" name="email" type="email" autoComplete="username" maxLength={254} required/>
        <label htmlFor="password">Kata sandi</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required/>
        <button type="submit">Masuk dengan aman</button>
      </form>
      <p className="helper">Pendaftaran pengurus dilakukan melalui administrator masjid. Pendaftaran mandiri belum diaktifkan.</p>
      <Link href="/">Kembali ke halaman utama</Link>
    </section>
  </main>;
}
