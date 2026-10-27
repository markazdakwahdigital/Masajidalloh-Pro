import {NextResponse,type NextRequest} from 'next/server';
import {isSocialPreviewRequest,socialPreviewHtml} from './lib/social-preview';
import {publicDataClient} from './lib/server/public-data';
/** Social crawlers receive only the same public branding, without loading private sessions or the full dashboard. */
export async function middleware(request:NextRequest){
 if(!isSocialPreviewRequest(request.method,request.headers.get('user-agent')||'',request.headers.has('rsc')||request.headers.has('next-action')))return NextResponse.next();
 const id=request.nextUrl.pathname.match(/^\/dashboard\/masjid\/([0-9a-f-]{36})\/?$/i)?.[1];if(!id)return NextResponse.next();
 try{
  const {data,error}=await publicDataClient().rpc('mp_public_mosques',{p_mosque:id,p_limit:1}).abortSignal(AbortSignal.timeout(3000));
  const mosque=data?.items?.[0];if(error||!mosque)return NextResponse.next();
  return new NextResponse(request.method==='HEAD'?null:socialPreviewHtml(id,mosque.name,request.nextUrl.searchParams.get('bagikan')==='logo4'),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'public, max-age=60','Vary':'User-Agent','X-Content-Type-Options':'nosniff'}});
 }catch{return NextResponse.next();}
}
export const config={matcher:'/dashboard/masjid/:mosqueId'};
