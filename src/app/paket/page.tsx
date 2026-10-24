import Link from 'next/link';
import Image from 'next/image';
import {TENANT_PLANS} from '@/lib/tenant-plans';
export const metadata={title:'Paket Layanan | MASAJIDALLOH PRO',description:'Pilih paket layanan Masjid. Basic gratis pada masa pilot; Pro dan Enterprise belum tersedia untuk pembayaran.'};
export default function PricingPage(){
 return <main className="tenant-landing">
 <header className="tenant-header"><Link href="/"><Image src="/brand/logo.webp?v=3" width={73} height={73} alt="MASAJIDALLOH PRO" unoptimized/><span><strong>MASAJIDALLOH PRO</strong><small>Professional Mosque Management Platform</small></span></Link><nav><Link href="/login">Login Pengurus</Link><Link href="/daftar-masjid">Daftarkan Masjid</Link></nav></header>
 <section className="tenant-hero"><span>✦ PLATFORM MASJID PROFESIONAL</span><h1>Pilih layanan yang sesuai kebutuhan Masjid Anda</h1><p>Bangun tata kelola Masjid yang makmur, adaptif dan berdaya. Pendaftaran pilot tersedia tanpa pembayaran.</p></section>
 <section className="plan-grid">{TENANT_PLANS.map(p=><article className={'plan-card '+(p.id==='BASIC'?'plan-featured':'')} key={p.id}>
  <div className="plan-emblem">{p.id==='BASIC'?'🕌':p.id==='PRO'?'✨':'🏛️'}</div><h2>{p.name.toUpperCase()}</h2><div className="plan-cost">{p.price}</div><p className="plan-period">{p.period}</p><p>{p.description}</p><div className="plan-divider"/>
  <ul>{p.benefits.map(b=><li key={b}>✓ {b}</li>)}</ul>
  {p.id==='ENTERPRISE'&&<Link className="enterprise-preview-link" href="/enterprise">Lihat tampilan & menu Enterprise →</Link>}
  {p.available?<Link className="plan-button" href="/daftar-masjid?paket=BASIC">Daftar Pilot Basic Gratis</Link>:<Link className="plan-button plan-muted" href={'/daftar-masjid?paket='+p.id}>Ajukan Minat {p.name}</Link>}
 </article>)}</section>
 <p className="tenant-disclaimer">Paket Pro dan Enterprise masih berupa rencana pengembangan, bukan produk siap dibeli. Tidak ada checkout atau penagihan otomatis. Pengajuan pendaftaran Masjid akan diverifikasi sebelum akun diaktifkan.</p>
 <footer>Developed by MARKAZ DAKWAH DIGITAL</footer>
 </main>;
}
