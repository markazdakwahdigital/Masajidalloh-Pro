'use server';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email');
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    redirect('/forgot-password?error=invalid');
  }
  let failed = false;
  let rateLimited = false;
  try {
    const client = await createSupabaseServerClient();
    const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'https://masajidalloh-pro.markazdakwahdigital-01.workers.dev/auth/finish',
    });
    failed = !!error;
    rateLimited = error?.status === 429;
  } catch { failed = true; }
  redirect(rateLimited ? '/forgot-password?error=rate-limit' : failed ? '/forgot-password?error=failed' : '/forgot-password?sent=1');
}
