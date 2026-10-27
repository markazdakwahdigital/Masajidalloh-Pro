import Link from 'next/link';
import {requireCurrentActor} from '@/lib/server/current-actor';
import {loadPrivateReport} from '@/app/components/private-report-actions';
import WorkspaceProvider from '@/app/components/workspace-provider';
import MosqueReports from '@/app/components/mosque-reports';
export const dynamic='force-dynamic';
export default async function PlatformReport({params}:{params:Promise<{mosqueId:string}>}){
 const actor=await requireCurrentActor();if(!actor.operator)return <main className="auth-page"><section className="auth-card"><h1>Khusus Admin Platform</h1><Link href="/dashboard">Kembali</Link></section></main>;
 const {mosqueId}=await params;let workspace;try{workspace=await loadPrivateReport(mosqueId);}catch{return <main className="auth-page"><section className="auth-card"><h1>Laporan Masjid belum tersedia</h1><Link href="/platform">Kembali ke Manajemen Tenant</Link></section></main>;}
 return <main className="tenant-landing"><header className="tenant-header"><h1>Laporan Privat · {workspace.name}</h1><Link href="/platform">Kembali ke Manajemen Tenant</Link></header><section className="tenant-register-card"><WorkspaceProvider {...workspace} canWrite={false} readOnly canExport exportAction={loadPrivateReport.bind(null,mosqueId)}><MosqueReports/></WorkspaceProvider></section></main>;
}
