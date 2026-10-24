import Image from 'next/image';
import Link from 'next/link';
import {applyTenant} from './actions';
import {TENANT_PLANS} from '@/lib/tenant-plans';
export const dynamic='force-dynamic';
export const metadata={title:'Pendaftaran Masjid | MASAJIDALLOH PRO'};
export default async function Register({searchParams}:{searchParams:Promise<{paket?:string;status?:string}>}){
 const {paket,status}=await searchParams;
 const chosen=TENANT_PLANS.some(x=>x.id===paket)?paket:'BASIC';
 return <main className="tenant-register">
  <div className="tenant-register-card">
   <Link className="tenant-register-brand" href="/"><Image src="/brand/logo.webp?v=3" alt="Logo resmi MASAJIDALLOH PRO" width={95} height={95} unoptimized/><strong>MASAJIDALLOH PRO</strong></Link>
   <h1>Daftarkan Masjid</h1><p>Isi identitas Masjid dan penanggung jawab. Tim platform akan meninjau permohonan sebelum akun diaktifkan.</p>
   {status==='received'&&<p className="tenant-message success" role="status">Jika data memenuhi persyaratan, permohonan Anda telah diterima atau sedang dalam peninjauan. Saat ini akun Masjid belum aktif. Jangan melakukan pembayaran apa pun.</p>}
   {status==='invalid'&&<p className="tenant-message warning" role="alert">Periksa kembali kolom wajib, email, dan nomor WhatsApp.</p>}
   {status==='unavailable'&&<p className="tenant-message warning" role="alert">Pendaftaran sementara tidak dapat disimpan. Silakan coba lagi nanti.</p>}
   <form className="tenant-register-form" action={applyTenant}>
    <label>Nama resmi Masjid<input name="mosqueName" minLength={3} maxLength={160} required placeholder="Nama Masjid"/></label>
    <label>Kota/kabupaten<input name="city" minLength={3} maxLength={100} required placeholder="Kota atau kabupaten"/></label>
    <label>Alamat Masjid<textarea name="address" required minLength={10} maxLength={500} rows={3} placeholder="Alamat lengkap Masjid"/></label>
    <label>Nama penanggung jawab<input name="contactName" minLength={3} maxLength={120} required placeholder="Nama pengurus yang mendaftar"/></label>
    <label>Email pengurus<input name="email" type="email" autoComplete="email" maxLength={254} required placeholder="Email yang aktif"/></label>
    <label>WhatsApp pengurus<input name="whatsapp" type="tel" minLength={9} maxLength={22} required placeholder="08... atau +62..."/></label>
    <label>Paket yang diminati<select name="plan" defaultValue={chosen}>{TENANT_PLANS.map(p=><option key={p.id} value={p.id}>{p.name} — {p.price}{p.available?'':' (pengajuan minat saja)'}</option>)}</select></label>
    <label className="tenant-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
    <p className="tenant-consent">Dengan mengirim permohonan, Anda menyetujui informasi kontak digunakan untuk proses verifikasi tenant. Pendaftaran tidak otomatis mengaktifkan akun atau membuat tagihan.</p>
    <button type="submit">Kirim Permohonan Masjid</button>
   </form>
   <p className="tenant-back"><Link href="/paket">← Pilih paket lain</Link> · <Link href="/login">Sudah terdaftar? Login</Link></p>
  </div>
 </main>;
}
