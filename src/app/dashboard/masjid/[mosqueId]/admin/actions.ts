'use server';
import {redirect} from 'next/navigation';
import {dataRpc} from '@/lib/server/data-api';
export async function inviteAdmin(mosqueId:string,form:FormData){
 try{await dataRpc('mp_invite_admin',{p_mosque:mosqueId,p_record:String(form.get('record')||'')});}catch(error){redirect('/dashboard/masjid/'+mosqueId+'/admin?status='+(error instanceof Error&&error.message==='admin_limit'?'limit':'failed'));}
 redirect('/dashboard/masjid/'+mosqueId+'/admin?status=invited');
}
export async function revokeAdmin(mosqueId:string,email:string){
 try{await dataRpc('mp_revoke_admin',{p_mosque:mosqueId,p_email:email});}catch{redirect('/dashboard/masjid/'+mosqueId+'/admin?status=failed');}
 redirect('/dashboard/masjid/'+mosqueId+'/admin?status=revoked');
}
