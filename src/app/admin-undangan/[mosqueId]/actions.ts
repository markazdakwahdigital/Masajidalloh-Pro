'use server';
import {redirect} from 'next/navigation';
import {dataRpc} from '@/lib/server/data-api';
export async function acceptAdmin(mosqueId:string){
 try{await dataRpc('mp_accept_admin',{p_mosque:mosqueId});}catch{redirect('/admin-undangan/'+mosqueId+'?status=failed');}
 redirect('/dashboard/masjid/'+mosqueId);
}
