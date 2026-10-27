'use server';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const continuing=formData.get('next')==='daftar-masjid';const suffix=continuing?'&next=daftar-masjid':'';
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || email.length > 254 || !password || password.length > 1024) redirect('/login?error=invalid'+suffix);
  let valid = false;
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    valid = !error;
  } catch { redirect('/login?error=config'+suffix); }
  if (!valid) redirect('/login?error=invalid'+suffix);
  redirect(continuing?'/daftar-masjid':'/dashboard');
}

export async function logout() {
  try { const client = await createSupabaseServerClient(); await client.auth.signOut(); }
  catch { /* Redirect to public landing even if sign-out provider unavailable. */ }
  redirect('/login');
}
