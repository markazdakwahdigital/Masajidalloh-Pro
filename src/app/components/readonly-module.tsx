'use client';
import {ENTERPRISE_MENU} from '@/lib/enterprise-menu';
import {MODULE_FIELDS} from '@/lib/mosque-workspace';
import {useWorkspace} from './workspace-provider';
import MosqueAccounts from './mosque-accounts';
export default function ReadonlyModule({kind}:{kind:string}){
 const {records,settings}=useWorkspace();const menu=ENTERPRISE_MENU.find(m=>m.id===kind);if(!menu)return null;
 const kinds=kind==='profil'?['dkm']:[kind];const rows=records.filter(r=>kinds.includes(r.kind));
 return <section className="brochure-panel enterprise-module" id={kind}><h2>{menu.label} · Laporan</h2><p className="brochure-note">Laporan dari data yang diinput Admin Masjid. Anda memiliki akses membaca.</p>
 {['profil','setting'].includes(kind)&&<dl className="reader-details">{MODULE_FIELDS[kind].filter(f=>Object.hasOwn(settings,f.key)).map(f=><div key={f.key}><dt>{f.label}</dt><dd>{String(settings[f.key as keyof typeof settings]||'—')}</dd></div>)}</dl>}
 {kind==='profil'&&<><h3>Rekening Bank &amp; E-wallet Masjid</h3><MosqueAccounts/></>}
 {kind==='profil'&&<h3>Pengurus Masjid</h3>}
 {kind==='laporan'?<div className="brochure-table-wrap"><table className="brochure-table"><caption>Ringkasan data menu</caption><thead><tr><th>Menu</th><th>Jumlah catatan</th></tr></thead><tbody>{ENTERPRISE_MENU.filter(m=>records.some(r=>r.kind===m.id)).map(m=><tr key={m.id}><td>{m.label}</td><td>{records.filter(r=>r.kind===m.id).length}</td></tr>)}</tbody></table><p>Buka menu terkait untuk melihat rincian laporan dari Admin.</p></div>:rows.length?<div className="dkm-records">{rows.map(row=><article key={row.id} className="dkm-record"><h3>{String(row.data.name||row.data.title||row.data.item||menu.label)}</h3><dl>{MODULE_FIELDS[row.kind]?.filter(f=>Object.hasOwn(row.data,f.key)).map(f=><div key={f.key}><dt>{f.label}</dt><dd>{typeof row.data[f.key]==='boolean'?(row.data[f.key]?'Ya':'Tidak'):String(row.data[f.key]||'—')}</dd></div>)}</dl></article>)}</div>:!['setting'].includes(kind)&&<p>Belum ada data {kind==='profil'?'Pengurus Masjid':menu.label} yang diinput Admin.</p>}
 </section>;
}
