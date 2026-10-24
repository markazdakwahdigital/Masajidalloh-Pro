'use server';
import {redirect} from 'next/navigation';
import {dataRpc} from '@/lib/server/data-api';
import {requireCurrentActor} from '@/lib/server/current-actor';
import {isPlan} from '@/lib/tenant-plans';
const value=(f:FormData,k:string)=>String(f.get(k)??'').trim();
export async function applyTenant(f:FormData){
 await requireCurrentActor();if(value(f,'website'))redirect('/daftar-masjid?status=received');
 const input=Object.fromEntries(['mosqueName','city','address','contactName','whatsapp','plan'].map(k=>[k,value(f,k)]));
 if(!isPlan(input.plan))redirect('/daftar-masjid?status=invalid');
 try{await dataRpc('mp_apply_tenant',{p_data:input});}catch(e){redirect('/daftar-masjid?status='+(e instanceof Error&&e.message==='application_rate_limit'?'limited':'unavailable'));}
 redirect('/daftar-masjid?status=received');
}
