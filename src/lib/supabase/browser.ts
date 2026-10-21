'use client';
import { createBrowserClient } from '@supabase/ssr';
export function createSupabaseBrowserClient(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key||key.startsWith('REPLACE_')) throw new Error('Supabase configuration unavailable');
  return createBrowserClient(url,key);
}
