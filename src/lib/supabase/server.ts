import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/** Always verify identity with auth.getUser(), not auth.getSession(), on protected routes. */
export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || key.startsWith('REPLACE_')) throw new Error('Supabase public configuration missing');
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(values) {
        try { values.forEach(({name,value,options}) => cookieStore.set(name,value,options)); }
        catch { /* Server Components cannot set cookies; sign-in/out use Server Actions. */ }
      },
    },
  });
}
