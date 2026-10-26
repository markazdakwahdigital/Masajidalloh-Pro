import {publicDataClient} from '@/lib/server/public-data';
import {readDkmPhoto} from '@/lib/server/dkm-drive';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{mosqueId:string}>}){
 try{
  const {mosqueId}=await params;if(!/^[\da-f-]{36}$/i.test(mosqueId))throw new Error();
  const client=publicDataClient();const {data,error}=await client.rpc('mp_chair_profile',{p_mosque:mosqueId});
  const chair=data as {id?:string;photoId?:string}|null;
  if(error||!chair?.id||!chair.photoId)throw new Error();
  const photo=await readDkmPhoto(mosqueId,chair.id,chair.photoId);
  return new Response(new Uint8Array(photo.bytes).buffer,{headers:{'Content-Type':photo.mimeType,'Cache-Control':'private, max-age=60','X-Content-Type-Options':'nosniff'}});
 }catch{return new Response(null,{status:404,headers:{'Cache-Control':'no-store'}});}
}
