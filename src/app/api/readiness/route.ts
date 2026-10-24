import {NextResponse} from 'next/server';
import {createSupabaseServerClient} from '@/lib/supabase/server';
export const dynamic='force-dynamic';
export async function GET(){
 try{const client=await createSupabaseServerClient();const {data,error}=await client.rpc('mp_ping');if(error||data!=='single-admin-v1')throw new Error();return NextResponse.json({status:'ok',check:'database-connectivity',database:'reachable',accessModel:'single-admin-v1'},{headers:{'Cache-Control':'no-store'}});}
 catch{return NextResponse.json({status:'unavailable',database:'unreachable'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
