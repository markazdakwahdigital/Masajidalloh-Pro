export type TenantPlan='BASIC'|'PRO'|'ENTERPRISE';
export const TENANT_PLANS=[
 {id:'BASIC',name:'Basic',price:'Gratis',period:'Selama program pilot',description:'Untuk masjid yang baru mulai mengelola data secara digital.',benefits:['Profil masjid','Agenda kegiatan','Dashboard pengurus','Pengguna sesuai izin yang diberikan'],available:true},
 {id:'PRO',name:'Pro',price:'Harga menyusul',period:'Belum dapat dibeli',description:'Untuk pengelolaan masjid yang memerlukan layanan lebih lengkap.',benefits:['Seluruh layanan Basic','Rencana modul keuangan dan donasi','Rencana inventaris dan laporan','Pengelolaan jamaah'],available:false},
 {id:'ENTERPRISE',name:'Enterprise',price:'Penawaran khusus',period:'Belum dapat dibeli',description:'Untuk yayasan dan jaringan masjid dengan kebutuhan terpusat.',benefits:['Seluruh layanan Pro','Rencana pengelolaan multi-masjid','Pelaporan dan audit terpusat','Penyesuaian implementasi'],available:false}
] as const;
export function isPlan(x:string):x is TenantPlan{return x==='BASIC'||x==='PRO'||x==='ENTERPRISE'}
