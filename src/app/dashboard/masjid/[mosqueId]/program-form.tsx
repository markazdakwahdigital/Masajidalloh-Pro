'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createProgram } from './program-actions';
type State={ok:boolean;message:string};
function Submit(){const {pending}=useFormStatus();return <button type="submit" disabled={pending}>{pending?'Menyimpan…':'Tambah kegiatan'}</button>;}
export default function ProgramForm({mosqueId}:{mosqueId:string}) {
  const [result,submit]=useActionState(async(previous:State|null,data:FormData)=>createProgram(mosqueId,previous,data),null);
  return <form className="auth-form" action={submit}>
    <label htmlFor="program-title">Nama kegiatan</label><input id="program-title" name="title" minLength={3} maxLength={140} required/>
    <label htmlFor="program-start">Tanggal dan jam (WIB)</label><input id="program-start" name="startsAt" type="datetime-local" required/>
    <label htmlFor="program-desc">Deskripsi (opsional)</label><textarea id="program-desc" name="description" maxLength={2000} rows={3}/>
    <Submit/>
    {result && <p role="status" className={result.ok?'success-text':'error'}>{result.message}</p>}
  </form>;
}
