'use server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireCurrentActor } from '@/lib/server/current-actor';
import { resolveTenantContext } from '@/lib/server/authorization';
import { AuthorizationError } from '@/lib/tenant';

type FormResult={ok:boolean;message:string};
async function verifyCurrentPermission(mosqueId:string,userId:string,permission:string) {
  const context=await resolveTenantContext(prisma,{userId},mosqueId);
  if(!context.permissions.has(permission)) throw new AuthorizationError();
  return context;
}
export async function createProgram(mosqueId:string,_previous:FormResult|null,formData:FormData):Promise<FormResult>{
  const actor=await requireCurrentActor();
  const context=await verifyCurrentPermission(mosqueId,actor.id,'program.manage');
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
  if(!Number.isFinite(startsAt.getTime())||startsAt.getFullYear()<2020)
    return {ok:false,message:'Waktu kegiatan tidak valid.'};
  // Atomically save activity and audit trail with the verified tenant.
  await prisma.$transaction(async tx=>{
    const member=await tx.mosqueMembership.findUnique({where:{mosqueId_userId:{mosqueId:context.mosqueId,userId:actor.id}},select:{status:true,mosque:{select:{status:true}},roles:{select:{role:{select:{permissions:{select:{permission:{select:{key:true}}}}}}}}}}});
    if(member?.status!=='ACTIVE'||member.mosque.status!=='ACTIVE'||!member.roles.some(r=>r.role.permissions.some(p=>p.permission.key==='program.manage'))) throw new AuthorizationError();
    const program=await tx.mosqueProgram.create({data:{
      mosqueId:context.mosqueId,title:title.trim(),description:description.trim()||null,
      startsAt,createdById:actor.id,status:'DRAFT'
    }});
    await tx.auditLog.create({data:{mosqueId:context.mosqueId,actorId:actor.id,action:'program.create',resource:program.id}});
  });
  revalidatePath('/dashboard/masjid/'+mosqueId);
  return {ok:true,message:'Kegiatan tersimpan sebagai draft.'};
}

/** A draft can be published, and a published event can be canceled. Never trust an id without tenant filtering. */
export async function changeProgramStatus(mosqueId:string,programId:string,target:'PUBLISHED'|'CANCELED'):Promise<void>{
  const actor=await requireCurrentActor();
  const context=await verifyCurrentPermission(mosqueId,actor.id,'program.manage');
  if(!/^[0-9a-f-]{36}$/i.test(programId)||!['PUBLISHED','CANCELED'].includes(target)) throw new AuthorizationError();
  await prisma.$transaction(async tx=>{
    const membership=await tx.mosqueMembership.findUnique({where:{mosqueId_userId:{mosqueId:context.mosqueId,userId:actor.id}},select:{status:true,mosque:{select:{status:true}},roles:{select:{role:{select:{permissions:{select:{permission:{select:{key:true}}}}}}}}}}});
    if(membership?.status!=='ACTIVE'||membership.mosque.status!=='ACTIVE'||!membership.roles.some(r=>r.role.permissions.some(p=>p.permission.key==='program.manage'))) throw new AuthorizationError();
    const allowedPrevious=target==='PUBLISHED'?'DRAFT':'PUBLISHED';
    const changed=await tx.mosqueProgram.updateMany({
      where:{id:programId,mosqueId:context.mosqueId,status:allowedPrevious},
      data:{status:target,updatedAt:new Date()}
    });
    if(changed.count!==1) throw new AuthorizationError();
    await tx.auditLog.create({data:{mosqueId:context.mosqueId,actorId:actor.id,action:target==='PUBLISHED'?'program.publish':'program.cancel',resource:programId}});
  });
  revalidatePath('/dashboard/masjid/'+mosqueId);
}
