import Link from 'next/link';
import {notFound} from 'next/navigation';
import {requireCurrentActor} from '@/lib/server/current-actor';
import {dataRpc} from '@/lib/server/data-api';
import {DashboardFrame} from '@/app/components/premium-dashboard';
import BrochureOverview from '@/app/components/brochure-overview';
import EnterpriseModules from '@/app/components/enterprise-modules';
import WorkspaceRefresh from '@/app/components/workspace-refresh';
import {type PackagePlan,type ModuleRecord,type WorkspaceSettings} from '@/lib/mosque-workspace';
import {saveWorkspace,archiveRecord} from './workspace-actions';
import {dkmDriveConfigured} from '@/lib/server/dkm-drive';
import {logout} from '@/app/login/actions';
export const dynamic='force-dynamic';
export default async function MosqueDashboard({params}:{params:Promise<{mosqueId:string}>}){
 const {mosqueId}=await params;if(!/^[\da-f-]{36}$/i.test(mosqueId))notFound();
 const actor=await requireCurrentActor();
 let workspace:{id:string;name:string;plan:PackagePlan;canWrite:boolean;settings:WorkspaceSettings;records:ModuleRecord[]};
 try{workspace=await dataRpc('mp_workspace',{p_mosque:mosqueId});}catch{return <main className="auth-page"><section className="auth-card"><h1>Akses Masjid belum tersedia</h1><p>Keanggotaan harus aktif pada Masjid ini. Hubungi Admin Masjid untuk persetujuan akses pembaca.</p><Link href="/dashboard">Kembali ke daftar Masjid</Link></section></main>;}
 return <DashboardFrame workspace={{...workspace,photoUploadEnabled:dkmDriveConfigured(),saveAction:saveWorkspace.bind(null,mosqueId),archiveAction:archiveRecord.bind(null,mosqueId)}} mosqueName={workspace.name} profileName={actor.name} profileRole={workspace.canWrite?'Admin Masjid':'Pengurus / Jamaah · Pembaca'} actions={<><Link href="/dashboard">← Daftar Masjid</Link><span> · {workspace.canWrite?'Anda adalah satu Admin Masjid.':'Akses pembaca: Dashboard dan laporan, tanpa formulir input.'}</span>{workspace.canWrite&&<Link href={'/dashboard/masjid/'+mosqueId+'/akses'}> · Kelola akses pembaca</Link>}<form action={logout}><button type="submit">Keluar</button></form></>}>
 <WorkspaceRefresh/><BrochureOverview/><EnterpriseModules/>
 </DashboardFrame>;
}
