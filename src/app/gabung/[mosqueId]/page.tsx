import Link from 'next/link';
import {requestReader} from './actions';
import {createSupabaseServerClient} from '@/lib/supabase/server';
export default async function Join({params,searchParams}:{params:Promise<{mosqueId:string}>;searchParams:Promise<{status?:string}>}){
 const {mosqueId}=await params,{status}=await searchParams;
 const client=await createSupabaseServerClient(),{data:{user}}=await client.auth.getUser();
 return <main className="auth-page"><section className="auth-card"><h1>Akses Pengurus / Jamaah</h1><p>Ajukan akses pembaca melalui tautan dari Admin Masjid. Admin akan meninjau permohonan Anda. Pembaca dapat melihat Dashboard dan laporan setiap menu, tanpa formulir input.</p>{status&&<p role="status">{status==='sent'?'Permohonan tercatat. Tunggu persetujuan Admin Masjid, lalu buka Dashboard.':'Permohonan belum dapat disimpan. Periksa akun dan tautan Masjid.'}</p>}{user?.email_confirmed_at?<form action={requestReader.bind(null,mosqueId)}><button type="submit">Ajukan Akses Pembaca</button></form>:<><Link className="plan-button" href="/buat-akun">Buat Akun & Verifikasi Email</Link><p><Link href="/login">Sudah punya akun? Masuk, lalu buka kembali tautan undangan ini.</Link></p></>}<p><Link href="/dashboard">Dashboard Saya</Link></p></section></main>;
}
