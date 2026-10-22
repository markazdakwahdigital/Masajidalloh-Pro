import Link from 'next/link';
import Image from 'next/image';
import InstallApp from './install-app';
const modules = [
  ['🕌','Baitullah','Ibadah dan jadwal shalat'],
  ['💰','Baitul Maal','Keuangan dan ZISWAF'],
  ['📚','Baitut Tarbiyah','Pendidikan dan pembinaan'],
  ['📢','Baitud Dakwah','Kajian dan kegiatan dakwah'],
  ['🤝','Baitul Muamalah','UMKM dan ekonomi umat'],
  ['🏗️','Pembangunan & Aset','Inventaris dan progres proyek'],
  ['❤️','Sosial & Santunan','Penyaluran dan pemberdayaan'],
  ['👥','SDM & Jamaah','Pengurus, relawan dan jamaah'],
];
export default function Home() {
  return <main className="shell">
    <header className="topbar"><Image className="official-logo" src="/brand/logo.webp" alt="Logo resmi MASAJIDALLOH PRO" width={70} height={70} unoptimized /><div><strong>MASAJIDALLOH <span>PRO</span></strong><small>Professional Mosque Management Platform</small></div><div className="top-right">Developed by MARKAZ DAKWAH DIGITAL</div></header>
    <section className="hero"><p className="eyebrow">SMART MOSQUE ECOSYSTEM</p><h1>Masjid Makmur,<br/><em>Adaptif, dan Berdaya.</em></h1><p>Platform pengelolaan masjid yang profesional, transparan, dan terintegrasi untuk Indonesia.</p><span className="status">● Tahap pengembangan · Layanan pengurus masih terbatas</span><p><Link className="hero-login" href="/login">Masuk ke Dashboard Pengurus →</Link></p><InstallApp /></section>
    <section className="content"><div className="section-head"><div><h2>Modul Pengelolaan Masjid</h2><p>Struktur awal navigasi. Fungsi operasional akan diaktifkan setelah autentikasi dan isolasi tenant diuji.</p></div><span className="pill">FASE 1</span></div><div className="cards">{modules.map(([icon,title,desc])=><article className="card" key={title}><div className="icon">{icon}</div><h3>{title}</h3><p>{desc}</p><span className="soon">Segera hadir</span></article>)}</div></section>
    <footer>© MASAJIDALLOH PRO · Developed by Markaz Dakwah Digital</footer>
  </main>;
}