'use server';
import {redirect} from 'next/navigation';
import {dataRpc} from '@/lib/server/data-api';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {saveTenantDraft,clearTenantDraft} from '@/lib/server/tenant-draft';
import {requireCurrentActor} from '@/lib/server/current-actor';
import {tenantApplicationInput} from '@/lib/tenant-registration';
const value=(f:FormData,k:string)=>String(f.get(k)??'').trim();
export async function applyTenant(f:FormData){
 if(value(f,'website'))redirect('/daftar-masjid?status=received');
 const input=tenantApplicationInput(f);
 if(!input)redirect('/daftar-masjid?status=invalid');
 const client=await createSupabaseServerClient();const {data:{user}}=await client.auth.getUser();
 if(!user?.email_confirmed_at){await saveTenantDraft(input);redirect('/buat-akun?next=daftar-masjid');}
 await requireCurrentActor();
 try{await dataRpc('mp_apply_tenant',{p_data:input});}catch(e){redirect('/daftar-masjid?status='+(e instanceof Error&&e.message==='application_rate_limit'?'limited':e instanceof Error&&e.message==='admin_registration_blocked'?'blocked':'unavailable'));}
 await clearTenantDraft();
 redirect('/daftar-masjid?status=received');
}
