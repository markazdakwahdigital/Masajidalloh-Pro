'use server';
import {redirect} from 'next/navigation';
import {dataRpc} from '@/lib/server/data-api';
export async function reviewTenant(id:string,approve:boolean){
 try{await dataRpc('mp_review_tenant',{p_request:id,p_approve:approve});}catch{redirect('/platform?status=failed');}
 redirect('/platform?status=saved');
}

export async function manageTenant(form:FormData){
 const mosqueId=String(form.get('mosqueId')||''),action=String(form.get('action')||''),value=String(form.get('value')||''),reason=String(form.get('reason')||'').trim();
 try{
  if(!/^[0-9a-f-]{36}$/i.test(mosqueId)||!['status','plan','admin','archive','restore'].includes(action)||reason.length<5||reason.length>500)throw new Error();
  const expected=JSON.parse(String(form.get('expected')||''));
  await dataRpc('mp_manage_tenant',{p_mosque:mosqueId,p_action:action,p_value:value,p_expected:expected,p_reason:reason});
 }catch{redirect('/platform?status=change-failed');}
 redirect('/platform?status=changed');
}
