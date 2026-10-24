import Link from 'next/link';
import { DashboardFrame } from '@/app/components/premium-dashboard';
import BrochureOverview from '@/app/components/brochure-overview';
import EnterpriseModules from '@/app/components/enterprise-modules';
import { ENTERPRISE_MENU } from '@/lib/enterprise-menu';

export const metadata={title:'Pratinjau Enterprise | MASAJIDALLOH PRO'};
export default function EnterprisePreview(){
 return <DashboardFrame overview profileName="Pratinjau Enterprise" profileRole="Tampilan pengelola masjid" searchItems={ENTERPRISE_MENU.map(item=>({label:item.label,href:'#'+item.id}))} actions={<div className="enterprise-preview-notice"><span>Pratinjau Enterprise · Angka dan agenda adalah contoh ilustrasi brosur</span><Link href="/paket">← Pilihan paket</Link></div>}><BrochureOverview illustration/><EnterpriseModules preview/></DashboardFrame>;
}
