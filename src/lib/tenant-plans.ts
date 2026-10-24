export type TenantPlan='BASIC'|'PRO'|'ENTERPRISE';
export const TENANT_PLANS=[
 {
  "id": "BASIC",
  "name": "Basic",
  "price": "99K",
  "description": "Cocok untuk Masjid yang baru mulai mengelola data secara digital.",
  "intro": "",
  "benefits": [
   "Dashboard Utama",
   "Profil Masjid",
   "Donasi",
   "Infaq & Shodaqoh",
   "Zakat",
   "Wakaf",
   "Jamaah",
   "Hak Akses (Admin Masjid & Jamaah)",
   "Setting"
  ],
  "period": "/bulan",
  "available": true
 },
 {
  "id": "PRO",
  "name": "Professional",
  "price": "199K",
  "description": "Cocok untuk pengelolaan Masjid yang memerlukan layanan lebih lengkap.",
  "intro": "Semua fitur Basic, ditambah:",
  "benefits": [
   "Keuangan",
   "Program & Kegiatan",
   "Penerima Manfaat",
   "Jadwal Sholat",
   "Laporan"
  ],
  "period": "/bulan",
  "available": true
 },
 {
  "id": "ENTERPRISE",
  "name": "Enterprise",
  "price": "249K",
  "description": "Cocok untuk Masjid yang ingin memiliki data inventarisasi aset yang rapi serta memiliki banyak program pemberdayaan yang melibatkan banyak organisasi dan jaringan.",
  "intro": "Semua fitur Professional, ditambah:",
  "benefits": [
   "Inventaris",
   "Donatur & Relawan",
   "UMKM Masjid",
   "Broadcast & Pengumuman"
  ],
  "period": "/bulan",
  "available": true
 }
] as const;
export function isPlan(x:string):x is TenantPlan{return x==='BASIC'||x==='PRO'||x==='ENTERPRISE'}
