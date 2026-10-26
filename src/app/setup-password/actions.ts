'use server';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function setPassword(formData: FormData) {
  const password=formData.get('password');
  const confirmation=formData.get('confirmation');
  if(typeof password!=='string'||password.length<12||password.length>128||password!==confirmation)
    redirect('/setup-password?error=invalid');
  const client=await createSupabaseServerClient();
  const {data:{user},error}=await client.auth.getUser();
  if(error||!user?.email_confirmed_at) redirect('/login');
  const result=await client.auth.updateUser({password});
  if(result.error) redirect('/setup-password?error=failed');
  redirect('/dashboard?password=updated');
}
