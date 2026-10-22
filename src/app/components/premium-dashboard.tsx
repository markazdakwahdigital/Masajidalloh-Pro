import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

const moduleLinks = [
  ['🏛️','Ringkasan Eksekutif','dashboard','active'],
  ['🕌','Profil & Identitas','profil','active'],
  ['🗓️','Program & Kegiatan','kegiatan','active'],
  ['💰','Keuangan & Kas','keuangan','soon'],
  ['🤲','ZISWAF & Donasi','ziswaf','soon'],
  ['👥','Jamaah & Pengurus','jamaah','soon'],
  ['📚','Pendidikan & Dakwah','pendidikan','soon'],
  ['🏗️','Inventaris & Aset','aset','soon'],
  ['🤝','UMKM & Pemberdayaan','ekonomi','soon'],
  ['📊','Laporan & Analitik','laporan','soon'],
] as const;

export function DashboardFrame({children,mosqueName,overview=false,actions}:{children:ReactNode;mosqueName?:string;overview?:boolean;actions?:ReactNode}){
 return <div className="premium-app" id="dashboard">
   <aside className="premium-sidebar">
    <Link href="/" className="side-brand">
      <Image src="/brand/logo.webp" alt="Logo MASAJIDALLOH PRO" width={104} height={102} className="brand-mark-large" unoptimized />
      <span className="brand-name">MASAJIDALLOH <b>PRO</b></span>
      <small>Professional Mosque Management Platform</small>
    </Link>
    <div className="side-divider"/>
    <div className="side-caption">MANAJEMEN MASJID</div>
    <nav aria-label="Menu utama">
     {moduleLinks.map(([icon,label,id,status])=>
      status==='active' && !overview
       ? <a className={'side-link '+(id==='dashboard'?'current':'')} key={id} href={'#'+id}><span className="side-ico">{icon}</span><span>{label}</span></a>
       : status==='active' && overview
       ? <Link className={'side-link '+(id==='dashboard'?'current':'')} key={id} href={id==='dashboard'?'/dashboard':'/dashboard'}><span className="side-ico">{icon}</span><span>{label}</span></Link>
       : <span className="side-link side-disabled" key={id} aria-label={label+' segera hadir'}><span className="side-ico">{icon}</span><span>{label}</span><small>Segera</small></span>
     )}
    </nav>
    <div className="side-foot"><span>✦</span> Masjid Makmur, Adaptif dan Berdaya <small>Developed by MARKAZ DAKWAH DIGITAL</small></div>
   </aside>
   <div className="premium-main">
    <header className="premium-topbar">
      <div className="mobile-brand"><Image src="/brand/logo.webp" width={44} height={44} alt="Logo MASAJIDALLOH PRO" unoptimized/><strong>MASAJIDALLOH <span>PRO</span></strong></div>
      <div className="topbar-context"><span className="mini-kicker">SMART MOSQUE CONTROL CENTER</span><strong>{mosqueName||'Ekosistem Manajemen Masjid'}</strong></div>
      <div className="topbar-actions">{actions??<Link href="/" className="premium-link">⌂ Beranda</Link>}</div>
    </header>
    <main className="premium-content">{children}</main>
    <footer className="premium-footer">MASAJIDALLOH PRO · Professional Mosque Management Platform · Developed by MARKAZ DAKWAH DIGITAL</footer>
   </div>
  </div>;
}
export function Panel({icon,title,sub,children,id}:{icon:string,title:string,sub?:string,children:ReactNode,id?:string}){
 return <section className="premium-panel" id={id}><div className="panel-heading"><span className="panel-icon">{icon}</span><div><h2>{title}</h2>{sub&&<p>{sub}</p>}</div></div>{children}</section>;
}
export function StatCard({icon,title,value,caption,tone='blue'}:{icon:string,title:string,value:string|number,caption:string,tone?:'blue'|'gold'|'green'|'purple'|'red'|'teal'}){
 return <article className={'gloss-stat tone-'+tone}><span className="stat-orb">{icon}</span><div className="stat-copy"><span>{title}</span><strong>{value}</strong><small>{caption}</small></div><span className="stat-spark">✦</span></article>;
}
