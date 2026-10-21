'use server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireCurrentActor } from '@/lib/server/current-actor';
import { resolveTenantContext } from '@/lib/server/authorization';
import { AuthorizationError } from '@/lib/tenant';

type FormResult={ok:boolean;message:string};
export async function createProgram(mosqueId:string,_previous:FormResult|null,formData:FormData):Promise<FormResult>{
  const actor=await requireCurrentActor();
  const context=await resolveTenantContext(prisma,{userId:actor.id},mosqueId);
  if(!context.permissions.has('program.manage')) throw new AuthorizationError();
  const title=formData.get('title');
  const description=formData.get('description');
  const start=formData.get('startsAt');
  if(typeof title!=='string'||title.trim().length<3||title.trim().length>140)
    return {ok:false,message:'Judul kegiatan harus 3–140 karakter.'};
  if(typeof description!=='string'||description.length>2000)
    return {ok:false,message:'Deskripsi maksimal 2.000 karakter.'};
  if(typeof start!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(start))
    return {ok:false,message:'Waktu kegiatan tidak valid.'};
  const startsAt=new Date(start+'+07:00');
  if(!Number.isFinite(startsAt.getTime()))
    return {ok:false,message:'Waktu kegiatan tidak valid.'};
  // Audit and program creation are atomic, both scoped to the authorized mosque.
  await prisma.$transaction(async tx=>{
    const member=await tx.mosqueMembership.findUnique({where:{mosqueId_userId:{mosqueId:context.mosqueId,userId:actor.id}},select:{status:true,mosque:{select:{status:true}}}});
    if(member?.status!=='ACTIVE'||member.mosque.status!=='ACTIVE') throw new AuthorizationError();
    const program=await tx.mosqueProgram.create({data:{
      mosqueId:context.mosqueId,title:title.trim(),description:description.trim()||null,
      startsAt,createdById:actor.id,status:'DRAFT'
    }});
    await tx.auditLog.create({data:{mosqueId:context.mosqueId,actorId:actor.id,action:'program.create',resource:program.id}});
  });
  revalidatePath('/dashboard/masjid/'+mosqueId);
  return {ok:true,message:'Kegiatan tersimpan sebagai draft.'};
}
