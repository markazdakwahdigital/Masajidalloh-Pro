'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

/** Handles a Supabase invitation/recovery link ONLY on the configured live origin. */
export default function FinishAuth() {
  const router=useRouter();
  const [message,setMessage]=useState('Memverifikasi tautan akun Anda…');
  useEffect(()=>{
    let cancelled=false;
    async function complete(){
      try {
        const client=createSupabaseBrowserClient();
        const fragment=new URLSearchParams(window.location.hash.replace(/^#/,''));
        const query=new URLSearchParams(window.location.search);
        const error=fragment.get('error')??query.get('error');
        if(error) throw new Error('link');
        // createBrowserClient automatically consumes the callback URL during
        // initialization. A second exchange consumes the same one-time code twice.
        const {data:{user},error:err}=await client.auth.getUser();
        if(err||!user) throw new Error('missing');
        window.history.replaceState(null,'',window.location.pathname);
        if(!cancelled) router.replace('/setup-password');
      } catch {
        window.history.replaceState(null,'',window.location.pathname);
        if(!cancelled) setMessage('Tautan tidak valid, telah digunakan, atau kedaluwarsa. Silakan minta tautan pemulihan baru.');
      }
    }
    void complete();
    return ()=>{cancelled=true;};
  },[router]);
  return <main className="auth-page"><section className="auth-card"><h1>Verifikasi akun pengurus</h1><p role="status">{message}</p><Link href="/forgot-password">Minta tautan pemulihan baru</Link><p><Link href="/login">Kembali ke login</Link></p></section></main>;
}
