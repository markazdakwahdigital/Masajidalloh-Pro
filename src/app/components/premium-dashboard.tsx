import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import ControlToolbar from './control-toolbar';
import EnterpriseNavigation from './enterprise-navigation';
import SidebarDrawer from './sidebar-drawer';
import WorkspaceProvider, {type WorkspaceProps} from './workspace-provider';
import SidebarContact from './sidebar-contact';

export function DashboardFrame({children,mosqueName,overview=false,actions,profileName,profileRole,profileImageSrc,profileRecordId,mosqueId,searchItems=[],workspace={}}:{children:ReactNode;mosqueName?:string;overview?:boolean;actions?:ReactNode;profileName?:string;profileRole?:string;profileImageSrc?:string;profileRecordId?:string;mosqueId?:string;searchItems?:Array<{label:string;href:string}>;workspace?:WorkspaceProps}){
 return <WorkspaceProvider {...workspace}><SidebarDrawer sidebar={<>
    <Link href="/" className="side-brand">
      <Image src="/brand/logo.webp?v=3" alt="MASAJIDALLOH PRO — Professional Mosque Management Platform — Masjid Makmur, Adaptif dan Berdaya" width={210} height={205} className="brand-mark-large" unoptimized />
    </Link>
    <div className="side-divider"/>
    <div className="side-caption">MANAJEMEN MASJID</div>
    <EnterpriseNavigation />
    <SidebarContact/>
   </>}>
   <div className="premium-main">
    <ControlToolbar mosqueName={mosqueName} profileName={profileName} profileRole={profileRole} profileImageSrc={profileImageSrc} profileRecordId={profileRecordId} mosqueId={mosqueId} searchItems={searchItems} backHref={!overview?'/dashboard':undefined} />
    {actions&&<div className="mdd-top-actions">{actions}</div>}
    <main className="premium-content">{children}</main>
    <footer className="premium-footer">MASAJIDALLOH PRO · Professional Mosque Management Platform · Developed by MARKAZ DAKWAH DIGITAL</footer>
   </div>
  </SidebarDrawer></WorkspaceProvider>;
}
export function Panel({icon,title,sub,children,id}:{icon:string,title:string,sub?:string,children:ReactNode,id?:string}){
 return <section className="premium-panel" id={id}><div className="panel-heading"><span className="panel-icon">{icon}</span><div><h2>{title}</h2>{sub&&<p>{sub}</p>}</div></div>{children}</section>;
}
export function StatCard({icon,title,value,caption,tone='blue'}:{icon:string,title:string,value:string|number,caption:string,tone?:'blue'|'gold'|'green'|'purple'|'red'|'teal'}){
 return <article className={'gloss-stat tone-'+tone}><span className="stat-orb">{icon}</span><div className="stat-copy"><span>{title}</span><strong>{value}</strong><small>{caption}</small></div><span className="stat-spark">✦</span></article>;
}
