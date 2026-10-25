import Link from 'next/link';
import {requireCurrentActor} from '@/lib/server/current-actor';
import {dataRpc} from '@/lib/server/data-api';
import {logout} from '@/app/login/actions';
export const dynamic='force-dynamic';
export default async function Dashboard({searchParams}:{searchParams:Promise<{welcome?:string}>}){
 const {welcome}=await searchParams;
 const actor=await requireCurrentActor();
 const home=await dataRpc<{mosques:Array<{id:string;name:string;plan:string;admin:boolean}>;applications:Array<{id:string;name:string;plan:string;status:string}>}>('mp_home');
 return <main className="tenant-landing"><header className="tenant-header"><strong>MASAJIDALLOH PRO</strong><nav><Link href="/daftar-masjid">Daftarkan Masjid</Link>{actor.operator&&<Link href="/platform">Manajemen Tenant</Link>}<form action={logout}><button type="submit">Keluar</button></form></nav></header><section className="tenant-hero"><h1>Masjid Anda</h1>{welcome==='verified'&&<p role="status">Pendaftaran akun berhasil. Email Anda sudah terverifikasi.</p>}<p>Selamat datang, {actor.name}. Pilih Masjid sesuai keanggotaan Anda.</p></section><section className="tenant-register-card">
 {home.mosques.length?home.mosques.map(m=><p key={m.id}><Link className="plan-button" href={'/dashboard/masjid/'+m.id}>{m.name} · {m.plan} · {m.admin?'Admin':'Pembaca'} →</Link></p>):<p>Belum ada keanggotaan aktif. Daftarkan Masjid sebagai Admin, atau gunakan tautan undangan pembaca dari Admin Masjid.</p>}
 <h2>Status pendaftaran Masjid</h2>{home.applications.length?home.applications.map(a=><p key={a.id}>{a.name} · {a.plan} · {a.status==='PENDING'?'Menunggu verifikasi operator':a.status==='APPROVED'?'Disetujui':'Ditolak'}</p>):<p>Belum ada permohonan pendaftaran.</p>}
 <Link href="/daftar-masjid">Daftarkan Masjid →</Link></section></main>;
}
