'use server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireCurrentActor } from '@/lib/server/current-actor';
import { resolveTenantContext } from '@/lib/server/authorization';
import { AuthorizationError } from '@/lib/tenant';

export async function updateMosqueProfile(mosqueId: string, formData: FormData) {
  const actor = await requireCurrentActor();
  const context = await resolveTenantContext(prisma,{userId:actor.id},mosqueId);
  if (!context.permissions.has('mosque.manage')) throw new AuthorizationError();
  const name = formData.get('name');
  if (typeof name !== 'string' || name.trim().length < 3 || name.trim().length > 120) {
    return {ok:false,message:'Nama Masjid harus terdiri dari 3–120 karakter.'};
  }
  const cleaned = name.trim();
  await prisma.$transaction(async tx => {
    // Recheck membership and role immediately before mutation.
    const member = await tx.mosqueMembership.findUnique({
      where:{mosqueId_userId:{mosqueId:context.mosqueId,userId:actor.id}},
      include:{mosque:true,roles:{include:{role:{include:{permissions:{include:{permission:true}}}}}}}
    });
    if (!member || member.status!=='ACTIVE' || member.mosque.status!=='ACTIVE' ||
        !member.roles.some(r=>r.role.permissions.some(p=>p.permission.key==='mosque.manage'))) {
      throw new AuthorizationError();
    }
    const updated = await tx.mosque.updateMany({
      where:{id:context.mosqueId,status:'ACTIVE'}, data:{name:cleaned},
    });
    if (updated.count !== 1) throw new AuthorizationError();
    await tx.auditLog.create({data:{
      mosqueId:context.mosqueId,actorId:actor.id,
      action:'mosque.profile.update',resource:'Mosque',
    }});
  });
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/masjid/'+mosqueId);
  return {ok:true,message:'Profil Masjid berhasil diperbarui.'};
}
