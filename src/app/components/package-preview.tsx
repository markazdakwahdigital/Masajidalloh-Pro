import Link from 'next/link';
import { DashboardFrame } from './premium-dashboard';
import BrochureOverview from './brochure-overview';
import EnterpriseModules from './enterprise-modules';
import { ENTERPRISE_MENU } from '@/lib/enterprise-menu';
import {hasModule,type PackagePlan} from '@/lib/mosque-workspace';
export default function PackagePreview({plan,name}:{plan:PackagePlan;name:string}){
 return <DashboardFrame workspace={{plan,preview:true}} overview profileName={'Prototype '+name} profileRole="Tampilan pengelola Masjid" searchItems={ENTERPRISE_MENU.filter(item=>hasModule(plan,item.id)).map(item=>({label:item.label,href:'#'+item.id}))} actions={<div className="enterprise-preview-notice"><span>Prototype {name} · Data sementara selama halaman ini terbuka</span><Link href="/paket">← Pilihan paket</Link></div>}><BrochureOverview/><EnterpriseModules preview/></DashboardFrame>;
}
