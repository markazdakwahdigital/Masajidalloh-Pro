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
    return {ok:false,message:'Nama masjid harus terdiri dari 3–120 karakter.'};
  }
  const cleaned = name.trim();
  // Atomically write profile and immutable evidence of the change.
  await prisma.$transaction(async tx => {
    // Defense in depth: only update the mosque associated with the approved context.
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
  return {ok:true,message:'Profil masjid berhasil diperbarui.'};
}
