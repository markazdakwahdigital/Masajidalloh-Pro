import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireCurrentActor } from '@/lib/server/current-actor';
import { resolveTenantContext } from '@/lib/server/authorization';
import { AuthorizationError } from '@/lib/tenant';
import ProfileForm from './profile-form';
import ProgramForm from './program-form';
import { changeProgramStatus } from './program-actions';

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
  return <main className="dashboard-shell">
    <header className="dashboard-bar"><div className="dashboard-brand"><Image className="official-logo" src="/brand/logo.webp" alt="Logo resmi MASAJIDALLOH PRO" width={46} height={46} unoptimized /><strong>MASAJIDALLOH <span>PRO</span></strong></div><Link href="/dashboard">← Daftar Masjid</Link></header>
    <div className="dashboard-content">
      <p className="eyebrow">MANAJEMEN MASJID</p><h1>{mosque.name}</h1>
      <p>Professional Mosque Management Platform</p>
      <section className="card"><h2>Profil Masjid</h2><p><strong>Slug:</strong> {mosque.slug}</p>
        {context.permissions.has('mosque.manage') ?
          <ProfileForm mosqueId={mosqueId} name={mosque.name}/> :
          <p>Anda memiliki akses membaca profil masjid.</p>}
      </section>
      {canReadPrograms && <section className="card" style={{marginTop:18}}>
        <h2>Program & Kegiatan Masjid</h2>
        <p>Agenda tercatat di database dan dipisahkan berdasarkan masjid. Waktu ditampilkan dalam WIB.</p>
        {programs.length===0?<p>Belum ada program atau kegiatan yang tercatat.</p>:
        <ul className="mosque-list">{programs.map(p=><li key={p.id}>
          <div><strong>{p.title}</strong><p>{p.description??'Tanpa deskripsi'}</p>
          <small>{new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'medium',timeStyle:'short'}).format(p.startsAt)} WIB</small></div>
          <div><span>{p.status==='DRAFT'?'Draft':p.status==='PUBLISHED'?'Terbit':'Dibatalkan'}</span>{context.permissions.has('program.manage') && p.status!=='CANCELED' && <form action={changeProgramStatus.bind(null,mosqueId,p.id,p.status==='DRAFT'?'PUBLISHED':'CANCELED')}><button className="subtle-action" type="submit">{p.status==='DRAFT'?'Publikasikan':'Batalkan'}</button></form>}</div>
        </li>)}</ul>}
        {context.permissions.has('program.manage')&&<><h3>Tambah kegiatan</h3><ProgramForm mosqueId={mosqueId}/></>}
      </section>}
      <section className="card" style={{marginTop:18}}>
        <h2>Ringkasan Operasional</h2>
        <p>Keuangan, ZISWAF, dan jamaah belum diaktifkan. Tidak ada angka demo yang disamarkan menjadi data nyata.</p>
      </section>
      <p className="helper">Developed by MARKAZ DAKWAH DIGITAL</p>
    </div>
  </main>;
}
