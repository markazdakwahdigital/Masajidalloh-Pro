'use client';
import { useEffect, useState } from 'react';
import { ENTERPRISE_MENU } from '@/lib/enterprise-menu';
import { MODULE_FIELDS, hasModule, dateKey, type ModuleData, type WorkspaceSettings } from '@/lib/mosque-workspace';
import { MenuIcon } from './enterprise-navigation';
import { useWorkspace } from './workspace-provider';

function ModuleForm({kind,settings}:{kind:string;settings:WorkspaceSettings}){
 const {save,records,preview,canWrite,plan}=useWorkspace();
 const [pending,setPending]=useState(false),[message,setMessage]=useState('');
 const [infaqForm,setInfaqForm]=useState('Barang');
 const fields=MODULE_FIELDS[kind];
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();const form=event.currentTarget,raw=new FormData(form),data:ModuleData={};
  fields.forEach(f=>{data[f.key]=f.type==='checkbox'?raw.has(f.key):String(raw.get(f.key)||'');});
  if(kind==='laporan'){
   if(String(data.from)>String(data.to)){setMessage('Tanggal akhir harus sesudah tanggal awal.');return;}
   const typeMap:Record<string,string>={Keuangan:'keuangan',Donasi:'donasi','Infaq & Shodaqoh':'infaq',Zakat:'zakat',Wakaf:'wakaf',Jamaah:'jamaah',Inventaris:'inventaris',Kegiatan:'kegiatan'};
   const rows=records.filter(row=>hasModule(plan,row.kind)&&row.kind===typeMap[String(data.type)]&&String(row.data.date||row.createdAt.slice(0,10))>=String(data.from)&&String(row.data.date||row.createdAt.slice(0,10))<=String(data.to));
   if(!rows.length){setMessage('Belum ada data sesuai jenis laporan dan periode ini.');return;}
   const columns=MODULE_FIELDS[typeMap[String(data.type)]];
   const cell=(value:unknown)=>'"'+String(value??'').replace(/^[\s]*[=+\-@]|^[\t\r]/,"'$&").replaceAll('"','""')+'"';
   const csv='\uFEFF'+[columns.map(f=>cell(f.label)).join(','),...rows.map(row=>columns.map(f=>cell(row.data[f.key])).join(','))].join('\r\n');
   const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='Laporan-Masjid-'+String(data.type)+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('Laporan diunduh dari data yang tercatat.');return;
  }
  setPending(true);const result=await save(kind,data);setPending(false);setMessage(result.message);
  if(result.ok&&!['profil','setting'].includes(kind)){form.reset();setInfaqForm('Barang');}
 }
 return <form className="brochure-form module-form" onSubmit={submit} onReset={()=>{setMessage('');setInfaqForm('Barang');}}>
 {fields.filter(f=>kind!=='infaq'||(infaqForm==='Uang'?!['item','quantity','unit'].includes(f.key):f.key!=='amount')).map(f=>{
  const required=!f.optional||(kind==='infaq'&&(['item','quantity','unit'].includes(f.key)?infaqForm!=='Uang':f.key==='amount'&&infaqForm==='Uang'));
  const initial=['profil','setting'].includes(kind)?String(settings[f.key as keyof WorkspaceSettings]||''):f.type==='date'?dateKey(new Date(),settings.timezone):undefined;
  return <label className={(f.type==='textarea'?'span-two ':'')+(f.type==='checkbox'?'module-checkbox':'')} key={f.key}>{f.label}{f.type==='select'?<select name={f.key} defaultValue={initial||f.options?.[0]} onChange={f.key==='form'?event=>setInfaqForm(event.target.value):undefined}>{f.options?.map(option=><option key={option}>{option}</option>)}</select>:f.type==='textarea'?<textarea name={f.key} rows={3} defaultValue={initial} maxLength={2000} required={required}/>:f.type==='checkbox'?<input name={f.key} type="checkbox" defaultChecked={f.key==='active'}/>:<input name={f.key} type={f.type==='url'?'text':f.type} inputMode={f.type==='url'?'url':undefined} min={f.type==='number'?'0.01':undefined} step={f.type==='number'?'0.01':undefined} max={f.type==='number'?'1000000000000':undefined} maxLength={300} defaultValue={initial} placeholder={f.type==='url'?'https://contoh.id':f.label} required={required}/>}</label>;
 })}
 <div className="module-actions span-two"><button type="submit" disabled={pending||(!canWrite&&kind!=='laporan')}>{pending?'Menyimpan…':kind==='laporan'?'Unduh Laporan CSV':preview?'Simpan Pratinjau':'Simpan Data'}</button><button type="reset" className="reset-button">↶ Reset</button></div>
 {message&&<p className="span-two brochure-note" role="status">{message}</p>}
 </form>;
}
export default function EnterpriseModules({preview:legacyPreview=false}:{preview?:boolean}){
 const {settings,records,plan,preview}=useWorkspace();
 const [active,setActive]=useState('');
 useEffect(()=>{const update=()=>setActive(window.location.hash.slice(1));update();window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update);},[]);
 const menu=ENTERPRISE_MENU.find(item=>item.id===active),fields=MODULE_FIELDS[active];
 const nativeProgram=!preview&&!legacyPreview&&active==='kegiatan';
 useEffect(()=>{if(!MODULE_FIELDS[active]||(!preview&&!legacyPreview&&active==='kegiatan'))return;const frame=requestAnimationFrame(()=>document.getElementById(active)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}));return()=>cancelAnimationFrame(frame);},[active,preview,legacyPreview]);
 if(!menu||!fields||nativeProgram||!hasModule(plan,active))return null;
 const rows=records.filter(row=>row.kind===active),columns=fields.slice(0,5);
 return <section className="brochure-panel enterprise-module" id={active} key={active}>
 <div className="brochure-panel-heading"><span className="gold-tile"><MenuIcon index={menu.icon}/></span><h2>{menu.label}</h2><span className="brochure-period">{plan}</span></div>
 {preview&&<p className="brochure-note">Data pratinjau sementara. Tidak tersimpan ke akun Masjid dan akan hilang ketika halaman dimuat ulang.</p>}
 {active==='keuangan'&&<p className="brochure-note">Catat pemasukan lain dan pengeluaran. Donasi, Infaq uang, Zakat, serta Wakaf uang dihitung dari menu asalnya; jangan dicatat ulang di sini.</p>}
 {active==='infaq'&&<p className="brochure-note">Barang, Makanan, dan Lainnya dicatat sebagai penerimaan non-uang; tidak menambah saldo kas.</p>}
 <ModuleForm key={active} kind={active} settings={settings}/>
 {!['setting','profil','laporan'].includes(active)&&<div className="brochure-table-wrap"><table className="brochure-table"><caption>Daftar {menu.label}</caption><thead><tr>{columns.map(column=><th scope="col" key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.length?rows.map(row=><tr key={row.id}>{columns.map(column=><td key={column.key}>{typeof row.data[column.key]==='boolean'?(row.data[column.key]?'Ya':'Tidak'):String(row.data[column.key]||'—')}</td>)}</tr>):<tr><td colSpan={columns.length}>Belum ada data {menu.label}.</td></tr>}</tbody></table></div>}
 </section>;
}
