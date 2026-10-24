import Link from 'next/link';
import Image from 'next/image';
import {CONSULTATION_URL} from '@/lib/consultation';
import {TENANT_PLANS} from '@/lib/tenant-plans';
export const metadata={title:'Paket Layanan | MASAJIDALLOH PRO',description:'Paket Basic 99K, Professional 199K, dan Enterprise 249K per bulan untuk pengelolaan Masjid.'};
export default function PricingPage(){
 return <main className="tenant-landing">
 <header className="tenant-header"><Link href="/"><Image src="/brand/logo.webp?v=3" width={73} height={73} alt="MASAJIDALLOH PRO" unoptimized/><span><strong>MASAJIDALLOH PRO</strong><small>Professional Mosque Management Platform</small></span></Link><nav><Link href="/login">Login Pengurus</Link><Link href="/daftar-masjid">Daftarkan Masjid</Link></nav></header>
 <section className="tenant-hero"><span>✦ PLATFORM MASJID PROFESIONAL</span><h1>Pilih layanan yang sesuai kebutuhan Masjid Anda</h1><p>Bangun tata kelola Masjid yang makmur, adaptif dan berdaya. Pilih cakupan fitur sesuai kebutuhan Masjid Anda.</p></section>
 <section className="plan-grid">{TENANT_PLANS.map(p=><article className={'plan-card '+(p.id==='BASIC'?'plan-featured':'')} key={p.id}>
  <div className="plan-emblem">{p.id==='BASIC'?'🕌':p.id==='PRO'?'✨':'🏛️'}</div><h2>{p.name.toUpperCase()}</h2><div className="plan-cost">{p.price}</div><p className="plan-period">{p.period}</p><p>{p.description}</p><div className="plan-divider"/>
  {p.intro&&<p><strong>{p.intro}</strong></p>}<ul>{p.benefits.map(b=><li key={b}>✓ {b}</li>)}</ul>
  <Link className="enterprise-preview-link prototype-button" href={p.id==='BASIC'?'/basic':p.id==='PRO'?'/professional':'/enterprise'} target="_blank" rel="noopener noreferrer">Prototype Aplikasi ↗</Link>
  <Link className="plan-button" href={'/daftar-masjid?paket='+p.id}>Pilih {p.name}</Link>
 </article>)}</section>
 <p style={{textAlign:'center'}}><a className="plan-button" href={CONSULTATION_URL} target="_blank" rel="noopener noreferrer">Konsultasi Gratis ↗</a></p>
 <p className="tenant-disclaimer">Harga berlangganan per bulan. Pengajuan pendaftaran ditinjau sebelum akun dan paket diaktifkan. Tidak ada checkout atau penagihan otomatis melalui halaman ini.</p>
 <footer>Developed by MARKAZ DAKWAH DIGITAL</footer>
 </main>;
}
