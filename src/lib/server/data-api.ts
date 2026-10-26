import 'server-only';
import {createSupabaseServerClient} from '@/lib/supabase/server';
export async function dataRpc<T>(name:string,args:Record<string,unknown>={}):Promise<T>{
 const client=await createSupabaseServerClient();
 const {data:{user},error:authError}=await client.auth.getUser();
 if(authError||!user?.id||!user.email_confirmed_at)throw new Error('verified_session_required');
 const {data,error}=await client.rpc(name,args);
 if(error)throw new Error(error.code==='42501'?'access_denied':['application_rate_limit','admin_registration_blocked','admin_limit'].includes(error.message)?error.message:'data_unavailable');
 return data as T;
}
