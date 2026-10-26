'use client';
/* eslint-disable @next/next/no-img-element -- Temporary blob photos are local previews and cannot use image optimization. */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ENTERPRISE_MENU } from '@/lib/enterprise-menu';
import { MODULE_FIELDS, hasModule, dateKey, type ModuleData, type ModuleRecord, type WorkspaceSettings } from '@/lib/mosque-workspace';
import {checkDkmPhoto} from '@/lib/dkm-photo';
import { MenuIcon } from './enterprise-navigation';
import ReadonlyModule from './readonly-module';
import MosqueAccounts from './mosque-accounts';
import { useWorkspace } from './workspace-provider';

function ModuleForm({kind,settings,editing,onSaved}:{kind:string;settings:WorkspaceSettings;editing?:ModuleRecord;onSaved?:()=>void}){
 const {save,records,preview,canWrite,plan,photoUploadEnabled}=useWorkspace();
 const [pending,setPending]=useState(false),[message,setMessage]=useState('');
 const [infaqForm,setInfaqForm]=useState(String(editing?.data.form||'Barang'));
 const fields=MODULE_FIELDS[kind];
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();const form=event.currentTarget,raw=new FormData(form),data:ModuleData={};
  fields.forEach(f=>{data[f.key]=f.type==='checkbox'?raw.has(f.key):String(raw.get(f.key)||'');});
  if(kind==='laporan'){
   if(String(data.from)>String(data.to)){setMessage('Tanggal akhir harus sesudah tanggal awal.');return;}
   const typeMap:Record<string,string>={Keuangan:'keuangan',Donasi:'donasi','Infaq & Shodaqoh':'infaq',Zakat:'zakat',Wakaf:'wakaf',Jamaah:'jamaah',Inventaris:'inventaris',Kegiatan:'kegiatan','Penerima Manfaat':'penerima'};
   const rows=records.filter(row=>hasModule(plan,row.kind)&&row.kind===typeMap[String(data.type)]&&String(row.data.date||row.createdAt.slice(0,10))>=String(data.from)&&String(row.data.date||row.createdAt.slice(0,10))<=String(data.to));
   if(!rows.length){setMessage('Belum ada data sesuai jenis laporan dan periode ini.');return;}
   const columns=MODULE_FIELDS[typeMap[String(data.type)]];
   const cell=(value:unknown)=>'"'+String(value??'').replace(/^[\s]*[=+\-@]|^[\t\r]/,"'$&").replaceAll('"','""')+'"';
   const csv='\uFEFF'+[columns.map(f=>cell(f.label)).join(','),...rows.map(row=>columns.map(f=>cell(row.data[f.key])).join(','))].join('\r\n');
   const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='Laporan-Masjid-'+String(data.type)+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('Laporan diunduh dari data yang tercatat.');return;
  }
  const attachment=raw.get('photo');const photo=attachment instanceof File&&attachment.size?attachment:undefined;
  if(photo){const error=checkDkmPhoto(photo.size,photo.type);if(error){setMessage(error);return;}}
  setPending(true);const result=await save(kind,data,photo,editing?.id);setPending(false);setMessage(result.message);
  if(result.ok&&!['profil','setting'].includes(kind)){form.reset();setInfaqForm('Barang');onSaved?.();}
 }
 return <form className="brochure-form module-form" onSubmit={submit} onReset={()=>{setMessage('');setInfaqForm(String(editing?.data.form||'Barang'));}}>
 {fields.filter(f=>kind!=='infaq'||(infaqForm==='Uang'?!['item','quantity','unit'].includes(f.key):f.key!=='amount')).map(f=>{
  const required=!f.optional||(kind==='infaq'&&(['item','quantity','unit'].includes(f.key)?infaqForm!=='Uang':f.key==='amount'&&infaqForm==='Uang'));
  const initial=editing?String(editing.data[f.key]??''):['profil','setting'].includes(kind)?String(settings[f.key as keyof WorkspaceSettings]||''):f.type==='date'?(['birthDate','endDate'].includes(f.key)?'':dateKey(new Date(),settings.timezone)):undefined;
  return <label className={(f.type==='textarea'?'span-two ':'')+(f.type==='checkbox'?'module-checkbox':'')} key={f.key}>{f.label}{f.type==='select'?<select name={f.key} defaultValue={initial||f.options?.[0]} onChange={f.key==='form'?event=>setInfaqForm(event.target.value):undefined}>{f.options?.map(option=><option key={option}>{option}</option>)}</select>:f.type==='textarea'?<textarea name={f.key} rows={3} defaultValue={initial} maxLength={2000} required={required}/>:f.type==='checkbox'?<input name={f.key} type="checkbox" defaultChecked={editing?editing.data[f.key]===true:f.key==='active'}/>:<input name={f.key} type={f.type==='url'?'text':f.type} inputMode={f.type==='url'?'url':undefined} min={f.type==='number'?'0.01':undefined} step={f.type==='number'?'0.01':undefined} max={f.type==='number'?'1000000000000':undefined} maxLength={300} defaultValue={initial} placeholder={f.type==='url'?'https://contoh.id':f.label} required={required}/>}</label>;
 })}
 {kind==='profil'&&<label className="span-two">Upload Logo<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>{const file=event.target.files?.[0];if(file){const error=checkDkmPhoto(file.size,file.type);setMessage(error||'Logo siap disimpan bersama Profile Masjid.');if(error)event.target.value='';}}}/><small>JPG, PNG, atau WebP · maksimum 2 MB. Logo tampil pada navigasi menu. Jika belum diunggah, logo Masajidalloh Pro tetap digunakan.</small></label>}
 {kind==='dkm'&&<label className="span-two">Foto Pengurus / DKM Masjid<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>{const file=event.target.files?.[0];if(file){const error=checkDkmPhoto(file.size,file.type);setMessage(error||'Foto siap disimpan bersama biodata.');if(error)event.target.value='';}}}/><small>JPG, PNG, atau WebP · maksimum 2 MB. {preview?'Foto pratinjau tidak diunggah dan hilang saat halaman dimuat ulang.':photoUploadEnabled?'Tujuan: folder privat Foto DKM Masjidalloh di Google Drive.':'Pilih foto maksimum 2 MB. Jika koneksi Drive belum siap, aplikasi akan memberi keterangan sebelum menyimpan foto.'}</small></label>}
 <div className="module-actions span-two"><button type="submit" disabled={pending||(!canWrite&&kind!=='laporan')}>{pending?'Menyimpan…':kind==='laporan'?'Unduh Laporan CSV':preview?'Simpan Pratinjau':'Simpan Data'}</button><button type="reset" className="reset-button">↶ Reset</button></div>
 {message&&<p className="span-two brochure-note" role="status">{message}</p>}
 </form>;
}
export default function EnterpriseModules({preview:legacyPreview=false,mosqueId}:{preview?:boolean;mosqueId?:string}){
 const {settings,records,plan,preview,canWrite,archive}=useWorkspace();
 const [active,setActive]=useState('');
 const [editing,setEditing]=useState<ModuleRecord|undefined>(),[feedback,setFeedback]=useState('');
 useEffect(()=>{const update=()=>setActive(window.location.hash.slice(1));update();window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update);},[]);
 const menu=ENTERPRISE_MENU.find(item=>item.id===active),fields=MODULE_FIELDS[active];
 useEffect(()=>{if(!MODULE_FIELDS[active])return;const frame=requestAnimationFrame(()=>document.getElementById(active)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}));return()=>cancelAnimationFrame(frame);},[active,preview,legacyPreview]);
 if(!menu||!fields||!hasModule(plan,active))return null;
 if(!canWrite)return <ReadonlyModule kind={active}/>;
 const rows=records.filter(row=>row.kind===active),columns=fields.slice(0,5);
 return <section className="brochure-panel enterprise-module" id={active} key={active}>
 <div className="brochure-panel-heading"><span className="gold-tile"><MenuIcon index={menu.icon}/></span><h2>{menu.label}</h2><span className="brochure-period">{plan}</span></div>
 {preview&&<p className="brochure-note">Data pratinjau sementara. Tidak tersimpan ke akun Masjid dan akan hilang ketika halaman dimuat ulang.</p>}
 {active==='setting'&&!preview&&mosqueId&&<section className="admin-account-tools"><h3>Keamanan &amp; Admin Masjid</h3><p>Setiap Masjid dapat mempunyai maksimal 3 Admin: 1 Admin utama dan 2 Admin tambahan.</p><p><Link href="/setup-password">Ubah Kata Sandi Aplikasi</Link> · <Link href={'/dashboard/masjid/'+mosqueId+'/admin'}>Kelola Admin Masjid</Link> · <Link href="/forgot-password">Lupa Kata Sandi</Link></p><p>Perubahan akses dan waktu perubahan kata sandi tercatat untuk Admin platform. Isi kata sandi tidak dapat dilihat.</p></section>}
 {active==='keuangan'&&<p className="brochure-note">Catat pemasukan lain dan pengeluaran. Donasi, Infaq uang, Zakat, serta Wakaf uang dihitung dari menu asalnya; jangan dicatat ulang di sini.</p>}
 {active==='infaq'&&<p className="brochure-note">Barang, Makanan, Minuman, dan Lainnya dicatat sebagai penerimaan non-uang; tidak menambah saldo kas.</p>}
 {feedback&&<p role="status">{feedback}</p>}
 {editing&&editing.kind===active&&<p>Mengubah catatan <button type="button" onClick={()=>setEditing(undefined)}>Batal ubah</button></p>}
 <ModuleForm key={active+(editing?.kind===active?editing.id:'new')} kind={active} settings={settings} editing={editing?.kind===active?editing:undefined} onSaved={()=>setEditing(undefined)}/>
 {active==='profil'&&<section className="mosque-account-management" aria-labelledby="account-title"><h3 id="account-title">Rekening Bank &amp; E-wallet Masjid</h3><p className="brochure-note">Tambahkan satu per satu rekening resmi milik Masjid. Semua rekening yang disimpan akan ditampilkan kepada publik di Dashboard Utama untuk Donasi, Infaq, dan Shodaqoh.</p><ModuleForm key={editing?.kind==='rekening'?editing.id:'rekening-new'} kind="rekening" settings={settings} editing={editing?.kind==='rekening'?editing:undefined} onSaved={()=>setEditing(undefined)}/>{editing?.kind==='rekening'&&<button type="button" onClick={()=>setEditing(undefined)}>Batal ubah rekening</button>}<MosqueAccounts onEdit={row=>setEditing(row)} onArchive={async id=>{const result=await archive(id);setFeedback(result.message);}}/></section>}
 {active==='profil'&&<section className="dkm-directory" aria-labelledby="dkm-title"><h3 id="dkm-title">Pengurus Masjid</h3><p className="brochure-note">Isi satu biodata untuk setiap Pengurus. Formulir ini terpisah dari identitas Profile Masjid.</p><ModuleForm key={editing?.kind==='dkm'?editing.id:'dkm-new'} kind="dkm" settings={settings} editing={editing?.kind==='dkm'?editing:undefined} onSaved={()=>setEditing(undefined)}/>{editing?.kind==='dkm'&&<button type="button" onClick={()=>setEditing(undefined)}>Batal ubah Pengurus</button>}<div className="dkm-records">{records.filter(row=>row.kind==='dkm').length?records.filter(row=>row.kind==='dkm').map(row=><article key={row.id} className="dkm-record"><h4>{String(row.data.name)} · {String(row.data.position)}</h4><button type="button" onClick={()=>setEditing(row)}>Ubah Pengurus</button><button type="button" onClick={async()=>{const result=await archive(row.id);setFeedback(result.message);}}>Arsipkan Pengurus</button>{preview&&row.data.photoPreview&&<img src={String(row.data.photoPreview)} width={96} height={96} alt={'Foto pratinjau '+String(row.data.name)}/>}<dl>{MODULE_FIELDS.dkm.map(field=><div key={field.key}><dt>{field.label}</dt><dd>{typeof row.data[field.key]==='boolean'?(row.data[field.key]?'Ya':'Tidak'):String(row.data[field.key]||'—')}</dd></div>)}</dl>{typeof row.data.photoId==='string'&&/^[-\w]{10,200}$/.test(row.data.photoId)&&<a href={'https://drive.google.com/file/d/'+row.data.photoId+'/view'} target="_blank" rel="noopener noreferrer">Lihat foto di Google Drive ↗</a>}{row.data.photoStatus==='failed'&&<p role="status">Biodata tersimpan, tetapi foto belum tersimpan ke Google Drive.</p>}</article>):<p className="brochure-note">Belum ada data Pengurus Masjid.</p>}</div></section>}

 {!['setting','profil','laporan'].includes(active)&&<div className="brochure-table-wrap"><table className="brochure-table"><caption>Daftar {menu.label}</caption><thead><tr>{columns.map(column=><th scope="col" key={column.key}>{column.label}</th>)}<th scope="col">Pengelolaan</th></tr></thead><tbody>{rows.length?rows.map(row=><tr key={row.id}>{columns.map(column=><td key={column.key}>{typeof row.data[column.key]==='boolean'?(row.data[column.key]?'Ya':'Tidak'):String(row.data[column.key]||'—')}</td>)}<td><button type="button" onClick={()=>setEditing(row)}>Ubah</button><button type="button" onClick={async()=>{const result=await archive(row.id);setFeedback(result.message);}}>Arsipkan</button></td></tr>):<tr><td colSpan={columns.length+1}>Belum ada data {menu.label}.</td></tr>}</tbody></table></div>}
 </section>;
}
