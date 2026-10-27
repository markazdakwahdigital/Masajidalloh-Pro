import {MODULE_FIELDS,hasModule,dateKey,type ModuleRecord,type WorkspaceSettings,type PackagePlan,type Field} from './mosque-workspace';
export const REPORT_KINDS:Record<string,string>={dkm:'Pengurus Masjid',rekening:'Rekening Bank & E-wallet',keuangan:'Keuangan',donasi:'Donasi',infaq:'Infaq & Shodaqoh',zakat:'Zakat',wakaf:'Wakaf',jamaah:'Jamaah',inventaris:'Inventaris',kegiatan:'Program & Kegiatan',penerima:'Penerima Manfaat',petugas:'Donatur & Relawan',umkm:'UMKM Masjid',broadcast:'Broadcast & Pengumuman',shalat:'Jadwal Sholat'};
export type ReportSection={kind:string;title:string;fields:Field[];rows:ModuleRecord[];total:number;incoming:number;outgoing:number;money:boolean};
export type MosqueReport={name:string;city:string;address:string;plan:string;timezone:string;from:string;to:string;generatedAt:string;preview:boolean;publicOnly:boolean;sections:ReportSection[];count:number};
export function makeReport({records,settings,plan,from,to,kind,preview=false,publicOnly=false,now=new Date()}:{records:ModuleRecord[];settings:WorkspaceSettings;plan:PackagePlan;from:string;to:string;kind:string;preview?:boolean;publicOnly?:boolean;now?:Date}):MosqueReport{
 const valid=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
 if(!valid(from)||!valid(to)||from>to)throw new Error('Periksa periode laporan. Tanggal akhir harus sama atau sesudah tanggal awal.');
 if(kind!=='all'&&(!REPORT_KINDS[kind]||!hasModule(plan,kind)))throw new Error('Jenis laporan tidak tersedia pada paket ini.');
 const timezone=settings.timezone||'Asia/Jakarta';
 const sections=Object.entries(REPORT_KINDS).filter(([k])=>hasModule(plan,k)&&(kind==='all'||k===kind)).map(([k,title])=>{
 const rows=records.filter(r=>r.kind===k).filter(r=>{const date=String(r.data.date||dateKey(new Date(r.createdAt),timezone));return date>=from&&date<=to;}).sort((a,b)=>String(a.data.date||a.createdAt).localeCompare(String(b.data.date||b.createdAt))||a.id.localeCompare(b.id));
 // Public records are already projected by the server; absent private fields must never be exported.
 const fields=MODULE_FIELDS[k].filter(f=>!publicOnly||rows.some(r=>Object.hasOwn(r.data,f.key)));
 const money=['keuangan','donasi','infaq','zakat','wakaf'].includes(k);
 let incoming=0,outgoing=0;
 for(const r of rows){if((k==='infaq'&&r.data.form!=='Uang')||(k==='wakaf'&&r.data.type!=='Uang'))continue;const n=Number(r.data.amount);if(!Number.isFinite(n)||n<0)continue;if(k==='keuangan'&&r.data.type==='Pengeluaran')outgoing+=n;else if(money)incoming+=n;}
 return {kind:k,title,rows,fields,money,total:incoming-outgoing,incoming,outgoing};
 });
 return {name:settings.name||'Masjid',city:settings.city||'',address:settings.address||'',plan,timezone,from,to,generatedAt:now.toISOString(),preview,publicOnly,sections,count:sections.reduce((n,s)=>n+s.rows.length,0)};
}
export const rupiah=(n:number)=>'Rp '+new Intl.NumberFormat('id-ID',{maximumFractionDigits:2}).format(n);
export function reportValue(value:unknown,field?:Field){if(value===undefined||value===null||value==='')return '-';if(typeof value==='boolean')return value?'Ya':'Tidak';if(field?.key==='amount'&&Number.isFinite(Number(value)))return rupiah(Number(value));return String(value);}
export function reportCsv(report:MosqueReport){
 const fields=new Map<string,Field>();for(const section of report.sections)for(const field of section.fields)if(!fields.has(field.key))fields.set(field.key,field);
 const columns=[...fields.values()];
 const headers=['Nama Masjid','Kota / Kabupaten','Periode Awal','Periode Akhir','Zona Waktu','Jenis Laporan','No','ID Catatan','Dibuat Pada',...columns.map(f=>f.label),'Status Data','Akses'];
 const rows:string[][]=[];
 for(const section of report.sections)for(const [i,r] of section.rows.entries())rows.push([report.name,report.city,report.from,report.to,report.timezone,section.title,String(i+1),r.id,r.createdAt,...columns.map(f=>Object.hasOwn(r.data,f.key)?reportValue(r.data[f.key],f):''),report.preview?'Pratinjau':'Tercatat',report.publicOnly?'Publik':'Admin']);
 const cell=(value:string)=>'"'+value.replace(/^[\s]*[=+\-@]|^[\t\r]/,"'$&").replaceAll('"','""')+'"';
 return '\uFEFF'+[headers,...rows].map(row=>row.map(cell).join(',')).join('\r\n');
}
export function reportFilename(report:MosqueReport,extension:string){const name=report.name.normalize('NFKD').replace(/[^a-z0-9]+/gi,'-').slice(0,70);return `Laporan-${name}-${report.from}-${report.to}.${extension}`;}
