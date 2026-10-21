import Link from 'next/link';
import 'server-only';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { logout } from '@/app/login/actions';

export const dynamic = 'force-dynamic';
export default async function Dashboard() {
  let authId: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const {data:{user},error} = await supabase.auth.getUser();
    if (!error && user?.id) authId = user.id;
  } catch { /* No authorized context. */ }
  if (!authId) redirect('/login');
  // Trusted identity is the verified Supabase auth.users UUID, never email submitted by browser.
  // Do not expose raw database errors or partially provisioned organizations.
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
  return <main className="dashboard-shell">
    <header className="dashboard-bar"><strong>MASAJIDALLOH <span>PRO</span></strong><form action={logout}><button type="submit">Keluar</button></form></header>
    <div className="dashboard-content">
      <p className="eyebrow">DASHBOARD TERLINDUNGI</p>
      <h1>Masjid yang dapat Anda akses</h1>
      {!configured ? <p role="status">Layanan data pengurus belum dikonfigurasi. Hubungi administrator sistem.</p> :
       mosques.length===0 ? <p role="status">Akun terverifikasi, tetapi belum memiliki keanggotaan masjid aktif. Hubungi administrator.</p> :
       <ul className="mosque-list">{mosques.map(m=><li key={m.id}><strong>{m.name}</strong><Link href={'/dashboard/masjid/'+m.id}>Buka profil masjid →</Link></li>)}</ul>}
      <p className="helper">Data keuangan, jamaah, dan pengelolaan masjid belum diaktifkan pada tahap ini.</p>
    </div>
  </main>;
}
