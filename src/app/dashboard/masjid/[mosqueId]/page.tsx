import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireCurrentActor } from '@/lib/server/current-actor';
import { resolveTenantContext } from '@/lib/server/authorization';
import { AuthorizationError } from '@/lib/tenant';
import ProfileForm from './profile-form';
import ProgramForm from './program-form';
import { changeProgramStatus } from './program-actions';
import { DashboardFrame, Panel, StatCard } from '@/app/components/premium-dashboard';

export const dynamic='force-dynamic';
export default async function MosquePage({params}:{params:Promise<{mosqueId:string}>}) {
  const {mosqueId}=await params;
  const actor=await requireCurrentActor();
  let context;
  try { context=await resolveTenantContext(prisma,{userId:actor.id},mosqueId); }
  catch(e) { if(e instanceof AuthorizationError) notFound(); throw e; }
  if(!context.permissions.has('mosque.read')) notFound();
  const mosque=await prisma.mosque.findUnique({where:{id:context.mosqueId},select:{name:true,slug:true}});
  if(!mosque) notFound();
  const canReadPrograms=context.permissions.has('program.read');
  const programs=canReadPrograms?await prisma.mosqueProgram.findMany({
    where:{mosqueId:context.mosqueId},orderBy:{startsAt:'asc'},take:50,
    select:{id:true,title:true,description:true,startsAt:true,status:true}
  }):[];
  const draft=programs.filter(p=>p.status==='DRAFT').length;
  const published=programs.filter(p=>p.status==='PUBLISHED').length;
  const canceled=programs.filter(p=>p.status==='CANCELED').length;
  // Identify Ketua DKM only from an actual active membership and role. Never assume the current user is Ketua DKM.
  let ketuaName: string | undefined;
  try {
   const ketua = await prisma.mosqueMembership.findFirst({where:{mosqueId:context.mosqueId,status:'ACTIVE',roles:{some:{role:{key:'ketua_dkm'}}}},select:{user:{select:{name:true}}}});
   ketuaName=ketua?.user.name;
  } catch { /* Role is optional in the current pilot schema. */ }
  const pct=programs.length>0?Math.round(published/programs.length*100):0;
  return <DashboardFrame mosqueName={mosque.name} profileName={ketuaName} profileRole={ketuaName?'Ketua DKM':'Ketua DKM · belum ditetapkan'} searchItems={[{label:'Ringkasan Eksekutif',href:'#dashboard'},{label:'Profil Masjid',href:'#profil'},...(canReadPrograms?[{label:'Program dan Kegiatan',href:'#kegiatan'},...programs.map(p=>({label:p.title,href:'#kegiatan'}))]:[])]} actions={<Link className="premium-link" href="/dashboard">← Daftar Masjid</Link>}>
    <section className="premium-welcome"><div><span className="welcome-kicker">✧ MANAJEMEN MASJID</span><h1>{mosque.name}</h1><p>Pengelolaan amanah masjid yang modern, profesional, dan transparan.</p><span className="welcome-chip">● Masjid aktif · Akses sesuai kewenangan</span></div><span className="welcome-emblem" aria-hidden="true">🕌</span></section>
    <div className="premium-stats">
      <StatCard icon="🗓️" title="TOTAL KEGIATAN" value={canReadPrograms?programs.length:'—'} caption={canReadPrograms?'Maksimal 50 kegiatan terbaru':'Akses terbatas'} tone="blue"/>
      <StatCard icon="✅" title="DIPUBLIKASIKAN" value={canReadPrograms?published:'—'} caption="Program aktif tercatat" tone="green"/>
      <StatCard icon="📝" title="DRAFT PROGRAM" value={canReadPrograms?draft:'—'} caption="Belum dipublikasikan" tone="gold"/>
      <StatCard icon="💰" title="KEUANGAN" value="—" caption="Modul belum diaktifkan" tone="purple"/>
    </div>
    <div className="premium-two-cols">
      <Panel id="profil" icon="🏛️" title="PROFIL MASJID" sub="Informasi identitas resmi masjid.">
       <p className="data-label">IDENTITAS MASJID</p><p className="slug-value">{mosque.slug}</p>
       {context.permissions.has('mosque.manage')?<ProfileForm mosqueId={mosqueId} name={mosque.name}/>:<p className="info-note">Anda hanya memiliki akses membaca profil masjid.</p>}
      </Panel>
      <Panel icon="📊" title="STATUS KEGIATAN" sub="Visualisasi menggunakan data kegiatan yang tercatat.">
       {canReadPrograms&&programs.length>0?<div className="donut-area">
         <div className="status-donut" style={{background:'conic-gradient(#12b87a 0% '+pct+'%, #f0bb36 '+pct+'% '+(pct+Math.round(draft/programs.length*100))+'%, #d85865 '+(pct+Math.round(draft/programs.length*100))+'% 100%)'}}><span><strong>{pct}%</strong><small>Terbit</small></span></div>
         <div className="donut-legend"><p><i className="dot published"/> Terbit <strong>{published}</strong></p><p><i className="dot draft"/> Draft <strong>{draft}</strong></p><p><i className="dot canceled"/> Dibatalkan <strong>{canceled}</strong></p></div>
       </div>:<div className="empty-chart"><span>◉</span><p>{canReadPrograms?'Belum ada kegiatan untuk divisualisasikan.':'Anda tidak mempunyai izin membaca kegiatan.'}</p></div>}
      </Panel>
    </div>
    {canReadPrograms&&<Panel id="kegiatan" icon="🗓️" title="PROGRAM & KEGIATAN" sub="Agenda nyata sesuai kewenangan dan data masjid. Waktu ditampilkan dalam WIB.">
     {programs.length===0?<p className="info-note">Belum ada program atau kegiatan yang tercatat.</p>:
      <div className="premium-program-list">{programs.map(p=><article className="premium-program" key={p.id}>
       <div className="program-bullet">📅</div><div className="program-body"><strong>{p.title}</strong><p>{p.description??'Tanpa deskripsi'}</p><small>{new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'medium',timeStyle:'short'}).format(p.startsAt)} WIB</small></div>
       <div className="program-actions"><span className={'program-status '+p.status.toLowerCase()}>{p.status==='DRAFT'?'Draft':p.status==='PUBLISHED'?'Terbit':'Dibatalkan'}</span>{context.permissions.has('program.manage') && p.status!=='CANCELED'&&<form action={changeProgramStatus.bind(null,mosqueId,p.id,p.status==='DRAFT'?'PUBLISHED':'CANCELED')}><button className="subtle-action" type="submit">{p.status==='DRAFT'?'Publikasikan':'Batalkan'}</button></form>}</div>
      </article>)}</div>}
     {context.permissions.has('program.manage')&&<div className="premium-input-panel"><h3>✦ Tambah Kegiatan Baru</h3><p>Isi formulir untuk menyimpan kegiatan pada database masjid ini.</p><ProgramForm mosqueId={mosqueId}/></div>}
    </Panel>}
    <Panel icon="💡" title="RINGKASAN OPERASIONAL" sub="Pengembangan bertahap sesuai kebutuhan pengelola masjid.">
      <div className="pending-module-grid">{[['💰','Keuangan'],['🤲','ZISWAF'],['👥','Jamaah'],['🏗️','Aset']].map(([icon,name])=><div key={name} className="pending-module"><span>{icon}</span><strong>{name}</strong><small>Belum aktif</small></div>)}</div>
      <p className="info-note">Belum ada angka keuangan, jamaah, atau donasi yang diaktifkan. Grafik tidak menggunakan data simulasi.</p>
    </Panel>
  </DashboardFrame>;
}
