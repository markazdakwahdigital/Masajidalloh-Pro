import {renderMosqueQr} from '@/lib/mosque-qr-image';
import {publicDataClient} from '@/lib/server/public-data';
import {publicMosqueUrl} from '@/lib/tenant-public-app';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{mosqueId:string}>}){
 try{
  const {mosqueId}=await params;const link=publicMosqueUrl(mosqueId);
  const {data,error}=await publicDataClient().rpc('mp_public_mosques',{p_mosque:mosqueId,p_limit:1});
  if(error||!data?.items?.[0])return new Response(null,{status:404,headers:{'Cache-Control':'no-store'}});
  const png=await renderMosqueQr(link);
  const download=new URL(request.url).searchParams.get('download')==='1';
  return new Response(new Uint8Array(png).buffer,{headers:{'Content-Type':'image/png','Content-Disposition':(download?'attachment':'inline')+'; filename="QR-Masjid-'+mosqueId.toLowerCase()+'.png"','Cache-Control':'public, max-age=60','X-Content-Type-Options':'nosniff'}});
 }catch{return new Response(null,{status:404,headers:{'Cache-Control':'no-store'}});}
}
