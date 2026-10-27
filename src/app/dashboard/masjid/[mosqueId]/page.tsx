import Link from 'next/link';
import type {Metadata} from 'next';
import {PUBLIC_APP_ORIGIN} from '@/lib/tenant-public-app';
import PublicDashboardShare from '@/app/components/public-dashboard-share';
import {publicDataClient} from '@/lib/server/public-data';
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
import {selectChair,chairPhotoUrl} from '@/lib/chair-profile';
import {loadPrivateReport} from '@/app/components/private-report-actions';
import {logout} from '@/app/login/actions';
export const dynamic='force-dynamic';
export async function generateMetadata({params,searchParams}:{params:Promise<{mosqueId:string}>;searchParams:Promise<{bagikan?:string}>}):Promise<Metadata>{
 const {mosqueId}=await params;const {bagikan}=await searchParams;
 const image=PUBLIC_APP_ORIGIN+'/brand/share-logo-v4.jpg';
 try{const {data,error}=await publicDataClient().rpc('mp_public_mosques',{p_mosque:mosqueId,p_limit:1});const m=data?.items?.[0];if(error||!m)return {title:'Dashboard Masjid belum tersedia',robots:{index:false,follow:false}};
 const title=m.name+' | MASAJIDALLOH PRO',description='Dashboard dan laporan publik '+m.name+'. Terbuka untuk Jamaah dan masyarakat tanpa login.',url=PUBLIC_APP_ORIGIN+'/dashboard/masjid/'+mosqueId;const shareUrl=url+(bagikan==='logo4'?'?bagikan=logo4':'');
 return {title,description,manifest:'/api/masjid/'+mosqueId+'/manifest',applicationName:m.name,appleWebApp:{capable:true,statusBarStyle:'default',title:m.name},alternates:{canonical:url},openGraph:{title,description,url:shareUrl,type:'website',siteName:'MASAJIDALLOH PRO',locale:'id_ID',images:[{url:image,secureUrl:image,type:'image/jpeg',width:640,height:640,alt:'Logo resmi MASAJIDALLOH PRO'}]},twitter:{card:'summary_large_image',title,description,images:[image]}};
 }catch{return {title:'Dashboard Masjid',robots:{index:false,follow:false}};}
}
export default async function MosqueDashboard({params}:{params:Promise<{mosqueId:string}>}){
 const {mosqueId}=await params;if(!/^[\da-f-]{36}$/i.test(mosqueId))notFound();
 const client=await createSupabaseServerClient();const {data:{user}}=await client.auth.getUser();
 let workspace:TenantWorkspace|undefined;
 if(user?.email_confirmed_at){try{workspace=await dataRpc('mp_workspace',{p_mosque:mosqueId});}catch{/* Non-admins receive only the public projection. */}}
 if(!workspace){try{workspace=await publicWorkspace(mosqueId);}catch{return <main className="auth-page"><section className="auth-card"><h1>Dashboard Masjid belum tersedia</h1><p>Masjid belum aktif atau sedang ditangguhkan.</p><Link href="/">Kembali</Link></section></main>;}}
 const canWrite=workspace.canWrite;
 const currentChair=selectChair(workspace.records);
 const {data:publicChair}=await publicDataClient().rpc('mp_chair_profile',{p_mosque:mosqueId});
 const chair=canWrite?(currentChair?{id:currentChair.id,name:String(currentChair.data.name),photoId:currentChair.data.photoId}:null):publicChair as {id:string;name:string;photoId?:string}|null;

 return <DashboardFrame overview workspace={{...workspace,canExport:canWrite,...(canWrite?{exportAction:loadPrivateReport.bind(null,mosqueId)}:{}),readOnly:!canWrite,photoUploadEnabled:canWrite&&dkmDriveConfigured(),...(canWrite?{saveAction:saveWorkspace.bind(null,mosqueId),archiveAction:archiveRecord.bind(null,mosqueId)}:{})}} mosqueName={workspace.name} mosqueId={mosqueId} profileName={chair?.name||'Ketua DKM belum diisi'} profileRole="Ketua DKM" profileRecordId={chair?.id} profileImageSrc={chairPhotoUrl(mosqueId,chair?.photoId)} actions={canWrite?<><Link href="/masjid">Direktori Masjid</Link><PublicDashboardShare mosqueId={mosqueId} name={workspace.name}/><Link href={'/dashboard/masjid/'+mosqueId+'/admin'}>Kelola Admin</Link><form action={logout}><button type="submit">Keluar</button></form></>:undefined}>
 <WorkspaceRefresh/><BrochureOverview mosqueId={mosqueId}/><EnterpriseModules mosqueId={mosqueId}/>
 </DashboardFrame>;
}
