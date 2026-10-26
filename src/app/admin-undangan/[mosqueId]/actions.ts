'use server';
import {redirect} from 'next/navigation';
import {dataRpc} from '@/lib/server/data-api';
export async function acceptAdmin(mosqueId:string){
 try{await dataRpc('mp_accept_admin',{p_mosque:mosqueId});}catch(error){redirect('/admin-undangan/'+mosqueId+'?status='+(error instanceof Error&&error.message==='admin_limit'?'limit':'failed'));}
 redirect('/dashboard/masjid/'+mosqueId);
}
