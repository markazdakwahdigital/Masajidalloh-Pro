import Link from 'next/link';
import 'server-only';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { logout } from '@/app/login/actions';
import { DashboardFrame, Panel } from '@/app/components/premium-dashboard';

import BrochureOverview from '@/app/components/brochure-overview';
import EnterpriseModules from '@/app/components/enterprise-modules';

export const dynamic = 'force-dynamic';
export default async function Dashboard() {
  let authId: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const {data:{user},error} = await supabase.auth.getUser();
    if (!error && user?.id) authId = user.id;
  } catch { /* No authorized context. */ }
  if (!authId) redirect('/login');
  let mosques: Array<{id:string;name:string}> = [];
  let profileName: string | undefined;
  let configured = true;
  try {
    const identity = await prisma.user.findUnique({
      where: { authUserId: authId },
      select: { name:true, memberships: {
        where: { status: 'ACTIVE', mosque: {status:'ACTIVE'}, roles: { some: {role: {permissions: {some: {permission: {key: 'mosque.read'}}}}} } },
        select: { mosque: { select:{ id:true, name:true } } },
      } },
    });
    mosques = identity?.memberships.map(x=>x.mosque) ?? [];
    profileName = identity?.name;
  } catch { configured = false; }
  return <DashboardFrame overview profileName={profileName} profileRole="Pengurus Masjid" searchItems={[{label:'Dashboard Pengurus',href:'/dashboard'},...mosques.map(m=>({label:m.name,href:'/dashboard/masjid/'+m.id}))]} actions={<form action={logout}><button className="topbar-logout" type="submit">↪ Keluar</button></form>}>
   <BrochureOverview/>
   <Panel id="profil" icon="🕌" title="DAFTAR MASJID" sub="Pilih Masjid untuk membuka profil, program, dan kegiatan operasional.">
     {!configured ? <p role="status" className="info-note">Layanan data pengurus belum dapat diakses. Hubungi administrator sistem.</p> :
       mosques.length===0 ? <p role="status" className="info-note">Akun terverifikasi, namun belum mempunyai keanggotaan Masjid aktif. Hubungi administrator.</p> :
       <div className="mosque-tiles">{mosques.map(m=><Link href={'/dashboard/masjid/'+m.id} className="mosque-tile" key={m.id}><span className="mosque-tile-icon">🕌</span><div><strong>{m.name}</strong><small>Profil dan program Masjid</small></div><span className="tile-arrow">→</span></Link>)}</div>}
   </Panel>
   <Panel id="kegiatan" icon="📊" title="MODUL PENGEMBANGAN" sub="Rencana integrasi dalam satu platform; belum menampilkan data keuangan atau jamaah.">
      <div className="pending-module-grid">{[['💰','Baitul Maal'],['🤲','ZISWAF'],['👥','Jamaah'],['🏗️','Aset'],['📚','Tarbiyah'],['🤝','Muamalah']].map(([icon,name])=><div key={name} className="pending-module"><span>{icon}</span><strong>{name}</strong><small>Segera hadir</small></div>)}</div>
   </Panel>
  <EnterpriseModules/></DashboardFrame>;
}
