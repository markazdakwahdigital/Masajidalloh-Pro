import 'server-only';
import {redirect} from 'next/navigation';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {dataRpc} from './data-api';
export async function requireCurrentActor(){
 const client=await createSupabaseServerClient();const {data:{user}}=await client.auth.getUser();
 if(!user||!user.email_confirmed_at)redirect('/login');
 return dataRpc<{id:string;name:string;email:string;operator:boolean}>('mp_identity');
}
