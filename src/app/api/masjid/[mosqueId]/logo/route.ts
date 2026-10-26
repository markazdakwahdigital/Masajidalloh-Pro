import {publicDataClient} from '@/lib/server/public-data';
import {readDkmPhoto} from '@/lib/server/dkm-drive';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{mosqueId:string}>}){
 try{
  const {mosqueId}=await params;if(!/^[\da-f-]{36}$/i.test(mosqueId))throw new Error();
  const {data,error}=await publicDataClient().rpc('mp_mosque_logo',{p_mosque:mosqueId});
  if(error||typeof data!=='string'||!/^[-\w]{10,200}$/.test(data))throw new Error();
  const photo=await readDkmPhoto(mosqueId,mosqueId,data);
  return new Response(new Uint8Array(photo.bytes).buffer,{headers:{'Content-Type':photo.mimeType,'Cache-Control':'private, max-age=60','X-Content-Type-Options':'nosniff'}});
 }catch{return new Response(null,{status:404,headers:{'Cache-Control':'no-store'}});}
}
