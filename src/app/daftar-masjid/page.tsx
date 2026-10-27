import Image from 'next/image';
import Link from 'next/link';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {applyTenant} from './actions';
import {dataRpc} from '@/lib/server/data-api';
import {readTenantDraft} from '@/lib/server/tenant-draft';
import {TENANT_PLANS} from '@/lib/tenant-plans';
export const dynamic='force-dynamic';
export const metadata={title:'Pendaftaran Masjid | MASAJIDALLOH PRO'};
export default async function Register({searchParams}:{searchParams:Promise<{paket?:string;status?:string}>}){
 const {paket,status}=await searchParams;
 const client=await createSupabaseServerClient();const {data:{user}}=await client.auth.getUser();
 const verified=Boolean(user?.email_confirmed_at);
 const canApply=verified?await dataRpc<boolean>('mp_can_apply'):false;
 const draft=await readTenantDraft();
 const chosen=TENANT_PLANS.some(x=>x.id===paket)?paket:(draft?.plan??'BASIC');
 return <main className="tenant-register">
  <div className="tenant-register-card">
   <Link className="tenant-register-brand" href="/"><Image src="/brand/logo.webp?v=3" alt="Logo resmi MASAJIDALLOH PRO" width={95} height={95} unoptimized/><strong>MASAJIDALLOH PRO</strong></Link>
   <h1>Daftarkan Masjid</h1><p>Isi identitas Masjid dan penanggung jawab. Tim platform akan meninjau permohonan sebelum akun diaktifkan.</p>
   {status==='received'&&<p className="tenant-message success" role="status">Jika data memenuhi persyaratan, permohonan Anda telah diterima atau sedang dalam peninjauan. Saat ini akun Masjid belum aktif. Jangan melakukan pembayaran apa pun.</p>}
   {status==='limited'&&<p role="alert">Maksimum dua pengajuan per akun dalam 24 jam. Periksa status di Dashboard Anda.</p>}
   {status==='invalid'&&<p className="tenant-message warning" role="alert">Periksa kembali kolom wajib, email, dan nomor WhatsApp.</p>}
   {status==='unavailable'&&<p className="tenant-message warning" role="alert">Pendaftaran sementara tidak dapat disimpan. Silakan coba lagi nanti.</p>}
   {verified&&!canApply?<div role="status"><p>Akun ini sudah terdaftar sebagai Admin Masjid atau memiliki permohonan yang sedang ditinjau. Pendaftaran Masjid baru tidak tersedia.</p><Link href="/dashboard">Buka Dashboard Saya</Link></div>:<form className="tenant-register-form" action={applyTenant}>
    {!verified&&<p className="tenant-message">Isi data Masjid terlebih dahulu. Setelah itu, verifikasi akun Admin untuk mengirim permohonan. Isian disimpan sementara selama satu jam pada browser ini.</p>}
    <label>Nama resmi Masjid<input name="mosqueName" defaultValue={draft?.mosqueName??''} minLength={3} maxLength={160} required placeholder="Nama Masjid"/></label>
    <label>Kota/kabupaten<input name="city" defaultValue={draft?.city??''} minLength={3} maxLength={100} required placeholder="Kota atau kabupaten"/></label>
    <label>Alamat Masjid<textarea name="address" defaultValue={draft?.address??''} required minLength={10} maxLength={500} rows={3} placeholder="Alamat lengkap Masjid"/></label>
    <label>Nama penanggung jawab<input name="contactName" defaultValue={draft?.contactName??''} minLength={3} maxLength={120} required placeholder="Nama pengurus yang mendaftar"/></label>
    <label>Email Masjid<input name="mosqueEmail" defaultValue={draft?.mosqueEmail??''} type="email" maxLength={254} required autoComplete="off" placeholder="Email Masjid"/></label>
    <label>WhatsApp Pengurus<input name="whatsapp" defaultValue={draft?.whatsapp??''} type="tel" minLength={9} maxLength={22} required placeholder="08... atau +62..."/></label>
    <label>WhatsApp Masjid<input name="mosqueWhatsapp" defaultValue={draft?.mosqueWhatsapp??''} type="tel" minLength={9} maxLength={22} required placeholder="Nomor WhatsApp resmi Masjid"/></label>
    <label>Paket yang diminati<select name="plan" defaultValue={chosen}>{TENANT_PLANS.map(p=><option key={p.id} value={p.id}>{p.name} — {p.price}{p.available?'':' (pengajuan minat saja)'}</option>)}</select></label>
    <label className="tenant-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
    <p className="tenant-consent">Dengan mengirim permohonan, Anda menyetujui informasi kontak digunakan untuk proses verifikasi tenant. Pendaftaran tidak otomatis mengaktifkan akun atau membuat tagihan.</p>
    <button type="submit">{verified?'Kirim Permohonan Masjid':'Lanjutkan Pendaftaran'}</button>
   </form>}
   <p className="tenant-back"><Link href="/paket">← Pilih paket lain</Link> · <Link href="/login">Sudah terdaftar? Login</Link></p>
  </div>
 </main>;
}
