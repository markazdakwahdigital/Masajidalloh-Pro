'use client';
import {ENTERPRISE_MENU} from '@/lib/enterprise-menu';
import {MODULE_FIELDS} from '@/lib/mosque-workspace';
import {useWorkspace} from './workspace-provider';
import MosqueAccounts from './mosque-accounts';
import {reportValue} from '@/lib/mosque-reports';
export default function ReadonlyModule({kind}:{kind:string}){
 const {records,settings}=useWorkspace();const menu=ENTERPRISE_MENU.find(m=>m.id===kind);if(!menu)return null;
 if(kind==='laporan')return <section className="brochure-panel enterprise-module" id="laporan"><h2>Laporan Privat</h2><p>Laporan hanya tersedia untuk Admin Masjid terkait dan Admin platform.</p></section>;
 const kinds=kind==='profil'?['dkm']:[kind];const rows=records.filter(r=>kinds.includes(r.kind));
 return <section className="brochure-panel enterprise-module" id={kind}><h2>{menu.label} · Laporan</h2>
 {['profil','setting'].includes(kind)&&<dl className="reader-details">{MODULE_FIELDS[kind].filter(f=>Object.hasOwn(settings,f.key)).map(f=><div key={f.key}><dt>{f.label}</dt><dd>{String(settings[f.key as keyof typeof settings]||'—')}</dd></div>)}</dl>}
 {kind==='profil'&&<><h3>Rekening Bank &amp; E-wallet Masjid</h3><MosqueAccounts/></>}
 {kind==='profil'&&<h3>Pengurus Masjid</h3>}
 {rows.length?<div className="dkm-records">{rows.map(row=><article key={row.id} className="dkm-record"><h3>{String(row.data.name||row.data.title||row.data.item||menu.label)}</h3><dl>{MODULE_FIELDS[row.kind]?.filter(f=>Object.hasOwn(row.data,f.key)).map(f=><div key={f.key}><dt>{f.label}</dt><dd>{typeof row.data[f.key]==='boolean'?(row.data[f.key]?'Ya':'Tidak'):reportValue(row.data[f.key],f)}</dd></div>)}</dl></article>)}</div>:!['setting'].includes(kind)&&<p>Belum ada data {kind==='profil'?'Pengurus Masjid':menu.label} yang diinput Admin.</p>}
 </section>;
}
