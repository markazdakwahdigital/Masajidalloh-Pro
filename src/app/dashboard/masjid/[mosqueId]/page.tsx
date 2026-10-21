import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireCurrentActor } from '@/lib/server/current-actor';
import { resolveTenantContext } from '@/lib/server/authorization';
import { AuthorizationError } from '@/lib/tenant';
import ProfileForm from './profile-form';

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
  return <main className="dashboard-shell">
    <header className="dashboard-bar"><strong>MASAJIDALLOH <span>PRO</span></strong><Link href="/dashboard">← Daftar Masjid</Link></header>
    <div className="dashboard-content">
      <p className="eyebrow">MANAJEMEN MASJID</p><h1>{mosque.name}</h1>
      <p>Professional Mosque Management Platform</p>
      <section className="card">
        <h2>Profil Masjid</h2>
        <p>Identitas masjid tersimpan di PostgreSQL. Hanya pengurus berizin yang dapat mengubahnya.</p>
        <p><strong>Slug:</strong> {mosque.slug}</p>
        {context.permissions.has('mosque.manage') ?
          <ProfileForm mosqueId={mosqueId} name={mosque.name}/> :
          <p>Anda memiliki akses membaca profil. Hubungi ketua takmir atau admin masjid untuk perubahan.</p>}
      </section>
      <section className="card" style={{marginTop:18}}>
        <h2>Ringkasan Operasional</h2>
        <p>Modul keuangan, jamaah, dan kegiatan belum diaktifkan. Tidak ada angka simulasi atau transaksi yang ditampilkan.</p>
      </section>
      <p className="helper">Developed by MARKAZ DAKWAH DIGITAL</p>
    </div>
  </main>;
}
