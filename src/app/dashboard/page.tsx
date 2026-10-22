import Link from 'next/link';
import 'server-only';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { logout } from '@/app/login/actions';
import { DashboardFrame, Panel, StatCard } from '@/app/components/premium-dashboard';

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
  let configured = true;
  try {
    const identity = await prisma.user.findUnique({
      where: { authUserId: authId },
      select: { memberships: {
        where: { status: 'ACTIVE', mosque: {status:'ACTIVE'}, roles: { some: {role: {permissions: {some: {permission: {key: 'mosque.read'}}}}} } },
        select: { mosque: { select:{ id:true, name:true } } },
      } },
    });
    mosques = identity?.memberships.map(x=>x.mosque) ?? [];
  } catch { configured = false; }
  return <DashboardFrame overview actions={<form action={logout}><button className="topbar-logout" type="submit">↪ Keluar</button></form>}>
   <section className="premium-welcome"><div><span className="welcome-kicker">✧ DASHBOARD PENGURUS</span><h1>Assalamu’alaikum, Selamat Datang</h1><p>Pusat kendali operasional masjid. Seluruh informasi yang ditampilkan berasal dari hak akses akun Anda.</p></div><span className="welcome-emblem" aria-hidden="true">🕌</span></section>
   <div className="premium-stats"><StatCard icon="🕌" title="MASJID TERDAFTAR" value={mosques.length} caption="Masjid yang dapat Anda akses" tone="blue"/><StatCard icon="🔐" title="AKSES PENGURUS" value="Aktif" caption="Sesi terautentikasi" tone="green"/><StatCard icon="📈" title="DATA KEUANGAN" value="—" caption="Modul belum diaktifkan" tone="gold"/></div>
   <Panel icon="🕌" title="DAFTAR MASJID" sub="Pilih masjid untuk membuka profil, program, dan kegiatan operasional.">
     {!configured ? <p role="status" className="info-note">Layanan data pengurus belum dapat diakses. Hubungi administrator sistem.</p> :
       mosques.length===0 ? <p role="status" className="info-note">Akun terverifikasi, namun belum mempunyai keanggotaan masjid aktif. Hubungi administrator.</p> :
       <div className="mosque-tiles">{mosques.map(m=><Link href={'/dashboard/masjid/'+m.id} className="mosque-tile" key={m.id}><span className="mosque-tile-icon">🕌</span><div><strong>{m.name}</strong><small>Profil dan program masjid</small></div><span className="tile-arrow">→</span></Link>)}</div>}
   </Panel>
   <Panel icon="📊" title="MODUL PENGEMBANGAN" sub="Rencana integrasi dalam satu platform; belum menampilkan data keuangan atau jamaah.">
      <div className="pending-module-grid">{[['💰','Baitul Maal'],['🤲','ZISWAF'],['👥','Jamaah'],['🏗️','Aset'],['📚','Tarbiyah'],['🤝','Muamalah']].map(([icon,name])=><div key={name} className="pending-module"><span>{icon}</span><strong>{name}</strong><small>Segera hadir</small></div>)}</div>
   </Panel>
  </DashboardFrame>;
}
