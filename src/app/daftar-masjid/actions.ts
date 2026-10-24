'use server';
import {redirect} from 'next/navigation';
import {prisma} from '@/lib/db';
import {isPlan} from '@/lib/tenant-plans';
import {headers} from 'next/headers';
const value=(f:FormData,k:string)=>String(f.get(k)??'').trim();
export async function applyTenant(f:FormData) {
  if(value(f,'website')) redirect('/daftar-masjid?status=received');
  const mosqueName=value(f,'mosqueName'),city=value(f,'city'),address=value(f,'address'),
    contactName=value(f,'contactName'),email=value(f,'email').toLowerCase(),whatsapp=value(f,'whatsapp'),plan=value(f,'plan');
  const valid=mosqueName.length>=3&&mosqueName.length<=160&&city.length>=3&&city.length<=100&&
    address.length>=10&&address.length<=500&&contactName.length>=3&&contactName.length<=120&&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)&&email.length<=254&&
    /^\+?[0-9\s()-]{9,22}$/.test(whatsapp)&&isPlan(plan);
  if(!valid)redirect('/daftar-masjid?status=invalid');
  const h=await headers();
  if(h.get('origin')&&new URL(h.get('origin')!).host!==h.get('host'))redirect('/daftar-masjid?status=invalid');
  try{
    const recent=await prisma.tenantApplication.count({where:{email,submittedAt:{gte:new Date(Date.now()-24*60*60*1000)}}});
    if(recent>=2)redirect('/daftar-masjid?status=received');
    await prisma.tenantApplication.create({data:{mosqueName,city,address,contactName,email,whatsapp,plan,status:'PENDING'}});
  }catch(err){
    // Next.js redirects are exceptions. Do not disguise any intentional redirect as an error.
    if(err&&typeof err==='object'&&'digest' in err&&String(err.digest).startsWith('NEXT_REDIRECT'))throw err;
    console.error('tenant_application_failed', {code:err&&typeof err==='object'&&'code' in err?String(err.code):'unknown',type:err instanceof Error?err.name:'unknown'});
    redirect('/daftar-masjid?status=unavailable');
  }
  redirect('/daftar-masjid?status=received');
}
