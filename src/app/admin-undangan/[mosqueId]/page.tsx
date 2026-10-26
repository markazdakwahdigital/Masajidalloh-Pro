import Link from 'next/link';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {acceptAdmin} from './actions';
export const dynamic='force-dynamic';
export default async function AdminInvitation({params,searchParams}:{params:Promise<{mosqueId:string}>;searchParams:Promise<{status?:string}>}){
 const {mosqueId}=await params,{status}=await searchParams;const client=await createSupabaseServerClient();const {data:{user}}=await client.auth.getUser();
 return <main className="auth-page"><section className="auth-card"><h1>Aktivasi Admin Tambahan</h1><p>Undangan hanya dapat diterima oleh akun dengan email terverifikasi yang sama dengan email Pengurus yang diundang.</p>{status&&<p role="alert">{status==='limit'?'Kapasitas maksimum 3 Admin Masjid sudah terpenuhi. Hubungi Admin utama.':'Undangan belum dapat diterima. Periksa email akun, status undangan, dan status Masjid. Email yang pernah menjadi Admin tidak dapat digunakan kembali.'}</p>}{user?.email_confirmed_at?<form action={acceptAdmin.bind(null,mosqueId)}><p>Akun: {user.email}</p><label><input type="checkbox" required/> Saya menerima tanggung jawab sebagai Admin tambahan Masjid.</label><button type="submit">Terima Undangan & Buka Dashboard</button></form>:<><Link href="/buat-akun">Buat Akun Admin & Verifikasi Email</Link><p><Link href="/login">Masuk</Link>, lalu buka kembali tautan undangan ini.</p></>}<p><Link href={'/dashboard/masjid/'+mosqueId}>Lihat Dashboard Publik</Link></p></section></main>;
}
