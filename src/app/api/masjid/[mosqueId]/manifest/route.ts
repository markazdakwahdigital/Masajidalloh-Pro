import {publicDataClient} from '@/lib/server/public-data';
import {mosqueManifest} from '@/lib/tenant-public-app';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{mosqueId:string}>}){
 try{
  const {mosqueId}=await params;mosqueManifest(mosqueId,'');
  const {data,error}=await publicDataClient().rpc('mp_public_mosques',{p_mosque:mosqueId,p_limit:1});
  const mosque=data?.items?.[0];if(error||!mosque)return new Response(null,{status:404,headers:{'Cache-Control':'no-store'}});
  return Response.json(mosqueManifest(mosqueId,mosque.name),{headers:{'Content-Type':'application/manifest+json; charset=utf-8','Cache-Control':'public, max-age=60','X-Content-Type-Options':'nosniff'}});
 }catch{return new Response(null,{status:404,headers:{'Cache-Control':'no-store'}});}
}
