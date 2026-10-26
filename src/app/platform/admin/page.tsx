import Link from 'next/link';
import {requireCurrentActor} from '@/lib/server/current-actor';
import {dataRpc} from '@/lib/server/data-api';
import WorkspaceRefresh from '@/app/components/workspace-refresh';
import ExportAdmins from './export';
export const dynamic='force-dynamic';
type Admin={userId:string;mosqueId:string;mosqueName:string;name:string;email:string;primary:boolean;tenantStatus:string;archived:boolean;since:string};
type Event={id:string;mosqueName:string;actorEmail:string;action:string;resource:string;createdAt:string};
function eventText(event:Event,admins:Admin[]){
 const labels:Record<string,string>={'admin.invite':'Undangan Admin dibuat','admin.accept':'Undangan Admin diterima','admin.revoke':'Akses atau undangan Admin dicabut','account.password.change':'Kata sandi aplikasi diperbarui','account.email.change':'Email akun diubah','tenant.admin.change':'Admin utama diganti','tenant.activate':'Tenant diaktifkan'};
 let detail='';try{const r=JSON.parse(event.resource);detail=event.action==='account.email.change'?r.beforeEmail+' → '+r.email:r.email||admins.find(a=>a.userId===r.value)?.email||r.reason||'';}catch{if(event.action!=='admin.accept'&&event.action!=='tenant.activate')detail=event.resource;}
 return (labels[event.action]||'Perubahan akses Admin')+(detail?' · '+detail:'');
}
export default async function AdminSecurity(){
 const actor=await requireCurrentActor();if(!actor.operator)return <main className="auth-page"><section className="auth-card"><h1>Khusus Admin Platform</h1><Link href="/dashboard">Kembali</Link></section></main>;
 const data=await dataRpc<{admins:Admin[];invites:Array<{mosqueName:string;email:string;status:string;createdAt:string}>;history:Event[]}>('mp_operator_admin_security');
 const date=(value:string)=>new Date(value).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})+' WIB';
 return <main className="tenant-landing"><header className="tenant-header"><h1>Admin Tenant &amp; Keamanan</h1><Link href="/platform">Kembali ke Manajemen Tenant</Link></header><section className="tenant-register-card"><p>Setiap tenant maksimal 3 Admin: 1 Admin utama dan 2 Admin tambahan. Catatan ini membantu pemulihan akun dan pengawasan akses.</p><p>Kata sandi tidak ditampilkan atau dicadangkan dalam daftar ini. Jika lupa, Admin meminta tautan pemulihan ke email akun yang tercatat.</p><ExportAdmins admins={data.admins}/><h2>Daftar Admin Tenant</h2><div className="brochure-table-wrap"><table className="brochure-table"><thead><tr><th>Masjid</th><th>Nama Admin</th><th>Email Login</th><th>Peran</th><th>Status Tenant</th><th>Sejak</th></tr></thead><tbody>{data.admins.map(a=><tr key={a.mosqueId+a.userId+a.primary}><td>{a.mosqueName}</td><td>{a.name}</td><td>{a.email}</td><td>{a.primary?'Admin Utama':'Admin Tambahan'}</td><td>{a.archived?'Diarsipkan':a.tenantStatus==='ACTIVE'?'Aktif':'Ditangguhkan'}</td><td>{date(a.since)}</td></tr>)}</tbody></table></div>{!data.admins.length&&<p>Belum ada Admin tenant.</p>}<h2>Undangan Admin</h2>{data.invites.length?data.invites.map((i,index)=><article className="dkm-record" key={i.email+index}><h3>{i.mosqueName}</h3><p>{i.email} · {i.status==='PENDING'?'Menunggu penerimaan':i.status==='ACCEPTED'?'Diterima':'Dicabut'}</p><small>{date(i.createdAt)}</small></article>):<p>Belum ada undangan.</p>}<h2>Riwayat Keamanan · 200 Terbaru</h2><p>Riwayat undangan dan akses mengikuti catatan yang tersedia. Pencatatan perubahan kata sandi/email mulai aktif sejak fitur ini diterapkan.</p>{data.history.length?data.history.map(event=><article className="dkm-record" key={event.id}><h3>{event.mosqueName}</h3><p>{eventText(event,data.admins)}</p><p>Pelaku: {event.actorEmail||'Sistem'} · {date(event.createdAt)}</p></article>):<p>Belum ada riwayat keamanan.</p>}<WorkspaceRefresh/></section></main>;
}
