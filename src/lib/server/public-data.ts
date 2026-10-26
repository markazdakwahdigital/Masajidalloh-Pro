import 'server-only';
import {createClient} from '@supabase/supabase-js';
/** Public projections use the publishable key without any visitor session. */
export function publicDataClient(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw new Error('Konfigurasi publik belum tersedia.');
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
}
