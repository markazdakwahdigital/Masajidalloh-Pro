import Link from 'next/link';
import {requireCurrentActor} from '@/lib/server/current-actor';
import {dataRpc} from '@/lib/server/data-api';
import {reviewReader,revokeReader} from './actions';
export const dynamic='force-dynamic';
export default async function Access({params}:{params:Promise<{mosqueId:string}>}){
 await requireCurrentActor();const {mosqueId}=await params;let readers:Array<{id:string;name:string;email:string;status:string}>;
 try{readers=await dataRpc('mp_readers',{p_mosque:mosqueId});}catch{return <main className="auth-page"><section className="auth-card"><h1>Akses khusus Admin Masjid</h1><Link href="/dashboard">Kembali</Link></section></main>;}
 const invite='https://masajidalloh-pro.markazdakwahdigital-01.workers.dev/gabung/'+mosqueId;
 return <main className="tenant-landing"><section className="tenant-register-card"><h1>Akses Pembaca Masjid</h1><p>Bagikan tautan ini kepada Pengurus dan Jamaah. Mereka harus membuat akun, memverifikasi email, dan mendapatkan persetujuan Anda. Akses ini tidak menambah Admin.</p><p><a href={invite}>{invite}</a></p>{readers.length?readers.map(r=><article className="dkm-record" key={r.id}><h2>{r.name}</h2><p>{r.email} · {r.status}</p>{r.status==='APPROVED'&&<form action={revokeReader.bind(null,mosqueId,r.id)}><button type="submit">Cabut Akses Pembaca</button></form>}{r.status==='PENDING'&&<div className="module-actions"><form action={reviewReader.bind(null,mosqueId,r.id,true)}><button type="submit">Setujui Pembaca</button></form><form action={reviewReader.bind(null,mosqueId,r.id,false)}><button type="submit">Tolak</button></form></div>}</article>):<p>Belum ada permohonan pembaca.</p>}<p><Link href={'/dashboard/masjid/'+mosqueId}>Kembali ke Dashboard Masjid</Link></p></section></main>;
}
