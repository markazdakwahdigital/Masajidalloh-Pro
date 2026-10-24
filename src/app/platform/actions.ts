'use server';
import {redirect} from 'next/navigation';
import {dataRpc} from '@/lib/server/data-api';
export async function reviewTenant(id:string,approve:boolean){
 try{await dataRpc('mp_review_tenant',{p_request:id,p_approve:approve});}catch{redirect('/platform?status=failed');}
 redirect('/platform?status=saved');
}
