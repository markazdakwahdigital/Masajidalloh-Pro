'use client';
import {useState} from 'react';
import {useWorkspace} from './workspace-provider';
import type {ModuleRecord} from '@/lib/mosque-workspace';
export default function MosqueAccounts({onEdit,onArchive}:{onEdit?:(row:ModuleRecord)=>void;onArchive?:(id:string)=>Promise<void>}){
 const {records,canWrite}=useWorkspace();
 const [message,setMessage]=useState(''),[busy,setBusy]=useState('');
 const accounts=records.filter(row=>row.kind==='rekening');
 async function copy(number:string){try{await navigator.clipboard.writeText(number.replace(/[ -]/g,''));setMessage('Nomor rekening / e-wallet berhasil disalin.');}catch{setMessage('Silakan pilih dan salin nomor rekening yang tercantum.');}}
 async function archive(id:string){if(!onArchive)return;setBusy(id);try{await onArchive(id);}finally{setBusy('');}}
 return <><div className="mosque-accounts">{accounts.length?accounts.map(row=><article className="mosque-account-card" key={row.id}><span>{String(row.data.type)}</span><h3>{String(row.data.provider)}</h3><p className="mosque-account-number">{String(row.data.number)}</p><p>Atas nama <strong>{String(row.data.holder)}</strong></p>{row.data.purpose&&<p>{String(row.data.purpose)}</p>}<div className="mosque-account-actions"><button type="button" onClick={()=>copy(String(row.data.number))}>Salin Nomor</button>{canWrite&&onEdit&&<button type="button" onClick={()=>onEdit(row)}>Ubah rekening</button>}{canWrite&&onArchive&&<button type="button" disabled={busy===row.id} onClick={()=>archive(row.id)}>{busy===row.id?'Mengarsipkan…':'Arsipkan rekening'}</button>}</div></article>):<p className="brochure-note">Rekening Bank dan e-wallet Masjid belum diisi oleh Admin.</p>}</div>{message&&<p role="status" className="brochure-note">{message}</p>}</>;
}
