'use server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireCurrentActor } from '@/lib/server/current-actor';
import { validateModule,hasModule,type PackagePlan,type ModuleData,type WorkspaceSettings } from '@/lib/mosque-workspace';
import type { SaveResult } from '@/app/components/workspace-provider';

export async function saveWorkspace(mosqueId:string,kind:string,input:ModuleData):Promise<SaveResult>{
 try{
  const actor=await requireCurrentActor();
  const checked=validateModule(kind,input);
  if(!checked.data||kind==='laporan')return {ok:false,message:checked.error||'Formulir tidak valid.'};
  const data=checked.data;
  const result=await prisma.$transaction(async tx=>{
   const member=await tx.mosqueMembership.findUnique({where:{mosqueId_userId:{mosqueId,userId:actor.id}},include:{mosque:true,roles:{include:{role:{include:{permissions:{include:{permission:true}}}}}}}});
   if(!member||member.status!=='ACTIVE'||member.mosque.status!=='ACTIVE'||!member.roles.some(r=>r.role.permissions.some(p=>p.permission.key==='mosque.manage')))throw new Error('denied');
   await tx.$queryRaw`SELECT id FROM public."Mosque" WHERE id=${mosqueId}::uuid FOR UPDATE`;
   const current=await tx.mosqueSettings.findUnique({where:{mosqueId}});
   const plan=(current?.plan||'BASIC') as PackagePlan;
   if(!hasModule(plan,kind))throw new Error('plan');
   if(['profil','setting'].includes(kind)){
    const settings={...(current?.data as WorkspaceSettings||{}),...data} as WorkspaceSettings;
    await tx.mosqueSettings.upsert({where:{mosqueId},create:{mosqueId,data:settings},update:{data:settings}});
    if(settings.name)await tx.mosque.update({where:{id:mosqueId},data:{name:settings.name}});
    await tx.auditLog.create({data:{mosqueId,actorId:actor.id,action:'mosque.settings.update',resource:'MosqueSettings'}});
    return {ok:true,message:'Pengaturan Masjid berhasil disimpan.',settings};
   }
   const row=await tx.mosqueRecord.create({data:{mosqueId,actorId:actor.id,kind,data}});
   await tx.auditLog.create({data:{mosqueId,actorId:actor.id,action:'mosque.record.create',resource:'MosqueRecord:'+row.id}});
   return {ok:true,message:'Data Masjid berhasil disimpan.',record:{id:row.id,kind:row.kind,data,createdAt:row.createdAt.toISOString()}};
  });
  revalidatePath('/dashboard/masjid/'+mosqueId);return result;
 }catch{return {ok:false,message:'Data tidak disimpan. Pastikan izin akun, paket Masjid, dan koneksi database tersedia.'};}
}
