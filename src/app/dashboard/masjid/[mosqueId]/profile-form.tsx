'use client';
import { useActionState } from 'react';
import { updateMosqueProfile } from './actions';
import { useFormStatus } from 'react-dom';
function SaveButton(){const {pending}=useFormStatus();return <button type="submit" disabled={pending}>{pending?'Menyimpan…':'Simpan perubahan'}</button>;}
export default function ProfileForm({mosqueId,name}:{mosqueId:string,name:string}) {
  const handler=updateMosqueProfile.bind(null,mosqueId);
  const [result,action]=useActionState(async(_previous:{ok:boolean;message:string}|null,formData:FormData)=>handler(formData),null);
  return <form className="auth-form" action={action}>
    <label htmlFor="mosque-name">Nama resmi masjid</label>
    <input id="mosque-name" name="name" defaultValue={name} minLength={3} maxLength={120} required/>
    <SaveButton/>
    {result && <p role="status" className={result.ok?'success-text':'error'}>{result.message}</p>}
  </form>;
}
