'use server';
import {revalidatePath} from 'next/cache';
import {dataRpc} from '@/lib/server/data-api';
export async function reviewReader(mosqueId:string,id:string,approve:boolean){await dataRpc('mp_reader_review',{p_mosque:mosqueId,p_request:id,p_approve:approve});revalidatePath('/dashboard/masjid/'+mosqueId+'/akses');}

export async function revokeReader(mosqueId:string,id:string){await dataRpc('mp_reader_revoke',{p_mosque:mosqueId,p_request:id});revalidatePath('/dashboard/masjid/'+mosqueId+'/akses');}
