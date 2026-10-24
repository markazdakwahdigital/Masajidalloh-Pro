import Link from 'next/link';
import { DashboardFrame } from '@/app/components/premium-dashboard';
import BrochureOverview from '@/app/components/brochure-overview';
import EnterpriseModules from '@/app/components/enterprise-modules';
import { ENTERPRISE_MENU } from '@/lib/enterprise-menu';

export const metadata={title:'Pratinjau Enterprise | MASAJIDALLOH PRO'};
export default function EnterprisePreview(){
 return <DashboardFrame workspace={{plan:'ENTERPRISE',preview:true}} overview profileName="Pratinjau Enterprise" profileRole="Tampilan pengelola Masjid" searchItems={ENTERPRISE_MENU.map(item=>({label:item.label,href:'#'+item.id}))} actions={<div className="enterprise-preview-notice"><span>Pratinjau Enterprise · Ringkasan berasal dari input Anda, data sementara selama halaman ini terbuka</span><Link href="/paket">← Pilihan paket</Link></div>}><BrochureOverview/><EnterpriseModules preview/></DashboardFrame>;
}
