import Link from 'next/link';
import {notFound} from 'next/navigation';
import {dataRpc} from '@/lib/server/data-api';
import {publicWorkspace,type TenantWorkspace} from '@/lib/server/public-workspace';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {DashboardFrame} from '@/app/components/premium-dashboard';
import BrochureOverview from '@/app/components/brochure-overview';
import EnterpriseModules from '@/app/components/enterprise-modules';
import WorkspaceRefresh from '@/app/components/workspace-refresh';
import {saveWorkspace,archiveRecord} from './workspace-actions';
import {dkmDriveConfigured} from '@/lib/server/dkm-drive';
import {logout} from '@/app/login/actions';
export const dynamic='force-dynamic';
export default async function MosqueDashboard({params}:{params:Promise<{mosqueId:string}>}){
 const {mosqueId}=await params;if(!/^[\da-f-]{36}$/i.test(mosqueId))notFound();
 const client=await createSupabaseServerClient();const {data:{user}}=await client.auth.getUser();
 let workspace:TenantWorkspace|undefined;
 if(user?.email_confirmed_at){try{workspace=await dataRpc('mp_workspace',{p_mosque:mosqueId});}catch{/* Non-admins receive only the public projection. */}}
 if(!workspace){try{workspace=await publicWorkspace(mosqueId);}catch{return <main className="auth-page"><section className="auth-card"><h1>Dashboard Masjid belum tersedia</h1><p>Masjid belum aktif atau sedang ditangguhkan.</p><Link href="/">Kembali</Link></section></main>;}}
 const canWrite=workspace.canWrite;
 return <DashboardFrame overview workspace={{...workspace,readOnly:!canWrite,photoUploadEnabled:canWrite&&dkmDriveConfigured(),...(canWrite?{saveAction:saveWorkspace.bind(null,mosqueId),archiveAction:archiveRecord.bind(null,mosqueId)}:{})}} mosqueName={workspace.name} profileName={canWrite?String(user?.user_metadata?.name||'Admin Masjid'):'Pengunjung'} profileRole={canWrite?'Admin Masjid':'Laporan Publik'} actions={canWrite?<><Link href={'/dashboard/masjid/'+mosqueId+'/admin'}>Kelola Admin</Link><form action={logout}><button type="submit">Keluar</button></form></>:<Link href="/login">Login Admin</Link>}>
 <WorkspaceRefresh/><BrochureOverview/><EnterpriseModules/>
 </DashboardFrame>;
}
