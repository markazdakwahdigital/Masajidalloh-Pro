import 'server-only';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { AuthorizationError } from '@/lib/tenant';

/** Supabase signed-in users MUST also be explicitly provisioned to the application. */
export async function requireCurrentActor() {
  const supabase = await createSupabaseServerClient();
  const {data:{user},error} = await supabase.auth.getUser();
  if (error || !user?.id) redirect('/login');
  const identity = await prisma.user.findUnique({
    where: {authUserId:user.id},
    select:{id:true, name:true},
  });
  if (!identity) throw new AuthorizationError();
  return identity;
}
