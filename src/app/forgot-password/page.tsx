import Link from 'next/link';
import { requestPasswordReset } from './actions';
export const dynamic = 'force-dynamic';

export default async function ForgotPassword({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const { error, sent } = await searchParams;
  return <main className="auth-page"><section className="auth-card">
    <p className="eyebrow">MASAJIDALLOH PRO</p><h1>Lupa kata sandi?</h1>
    <p>Masukkan email akun Anda untuk meminta tautan pengaturan kata sandi baru.</p>
    {sent && <p role="status" className="success-text">Jika email terdaftar, tautan pemulihan akan dikirim. Periksa kotak masuk dan folder spam. Buka tautan menggunakan browser yang sama.</p>}
    {error && <p role="alert" className="error">{error === 'invalid' ? 'Masukkan alamat email yang valid.' : error === 'rate-limit' ? 'Batas pengiriman email sementara tercapai. Tunggu hingga kuota tersedia kembali sebelum meminta tautan baru. Gunakan hanya email pemulihan paling baru.' : 'Permintaan belum dapat diproses. Tunggu beberapa saat lalu coba lagi.'}</p>}
    <form action={requestPasswordReset} className="auth-form">
      <label htmlFor="email">Email terdaftar</label><input id="email" name="email" type="email" autoComplete="email" maxLength={254} required />
      <button type="submit">Kirim tautan pemulihan</button>
    </form>
    <Link href="/login">Kembali ke login</Link>
  </section></main>;
}
