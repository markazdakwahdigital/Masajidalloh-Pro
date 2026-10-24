import Link from 'next/link';
import { DashboardFrame } from './premium-dashboard';
import BrochureOverview from './brochure-overview';
import EnterpriseModules from './enterprise-modules';
import { ENTERPRISE_MENU } from '@/lib/enterprise-menu';
import {hasModule,type PackagePlan} from '@/lib/mosque-workspace';
export default function PackagePreview({plan,name,reader=false}:{plan:PackagePlan;name:string;reader?:boolean}){
 return <DashboardFrame workspace={{plan,preview:true,readOnly:reader}} overview profileName={'Prototype '+name} profileRole="Tampilan pengelola Masjid" searchItems={ENTERPRISE_MENU.filter(item=>hasModule(plan,item.id)).map(item=>({label:item.label,href:'#'+item.id}))} actions={<div className="enterprise-preview-notice"><span>Prototype {name} · {reader?'Pembaca: laporan tanpa formulir':'Admin: input simulasi'} · Data sementara</span><Link href={(plan==='BASIC'?'/basic':plan==='PRO'?'/professional':'/enterprise')+(reader?'':'?mode=pembaca')}>{reader?'Coba tampilan Admin':'Coba tampilan Pembaca'}</Link><Link href="/paket">← Pilihan paket</Link></div>}><BrochureOverview/><EnterpriseModules preview/></DashboardFrame>;
}
