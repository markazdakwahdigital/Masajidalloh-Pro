import Link from 'next/link';
import {requireCurrentActor} from '@/lib/server/current-actor';
import {dataRpc} from '@/lib/server/data-api';
import {reviewTenant} from './actions';
export const dynamic='force-dynamic';
type Application={id:string;mosqueName:string;city:string;address:string;contactName:string;email:string;whatsapp:string;plan:string;status:string};
export default async function Platform({searchParams}:{searchParams:Promise<{status?:string}>}){
 const actor=await requireCurrentActor();if(!actor.operator)return <main className="auth-page"><section className="auth-card"><h1>Khusus Operator Platform</h1><p>Aktivasi tenant hanya dapat dilakukan oleh akun pemilik platform yang emailnya sudah terverifikasi.</p><Link href="/dashboard">Kembali</Link></section></main>;
 const {status}=await searchParams;const data=await dataRpc<{applications:Application[];tenants:Array<{id:string;name:string;plan:string;admin:string}>}>('mp_operator');
 return <main className="tenant-landing"><header className="tenant-header"><h1>Aktivasi Tenant</h1><Link href="/dashboard">Dashboard Saya</Link></header><section className="tenant-register-card"><p>Periksa identitas dan persetujuan layanan sebelum aktivasi. Aktivasi membuat satu Admin pada Masjid baru; tidak memproses pembayaran.</p>{status&&<p role="status">{status==='saved'?'Keputusan tersimpan.':'Keputusan belum tersimpan; periksa status pemohon.'}</p>}<h2>Permohonan Masjid</h2>{data.applications.length?data.applications.map(a=><article className="dkm-record" key={a.id}><h3>{a.mosqueName} · {a.plan}</h3><p>{a.city} · {a.address}</p><p>{a.contactName} · {a.email} · {a.whatsapp}</p><p>Status: {a.status}</p>{a.status==='PENDING'&&<div className="module-actions"><form action={reviewTenant.bind(null,a.id,true)}><button type="submit">Setujui & Aktifkan</button></form><form action={reviewTenant.bind(null,a.id,false)}><button type="submit">Tolak Permohonan</button></form></div>}</article>):<p>Belum ada permohonan.</p>}<h2>Tenant aktif</h2>{data.tenants.map(t=><p key={t.id}>{t.name} · {t.plan} · Admin: {t.admin||'Belum ditetapkan'}</p>)}</section></main>;
}
