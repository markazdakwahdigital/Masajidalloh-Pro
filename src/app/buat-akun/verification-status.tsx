'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {createSupabaseBrowserClient} from '@/lib/supabase/browser';
export default function VerificationStatus(){
 const router=useRouter(); const [verified,setVerified]=useState(false);
 useEffect(()=>{
  let active=true,busy=false; const client=createSupabaseBrowserClient();
  async function check(){
   if(busy||!active||document.visibilityState==='hidden')return;
   busy=true;
   try{const {data:{user},error}=await client.auth.getUser();if(active&&!error&&user?.email_confirmed_at)setVerified(true);}catch{/* Retry when the tab returns or the network recovers. */}finally{busy=false;}
  }
  void check(); const timer=window.setInterval(()=>void check(),10000);
  window.addEventListener('focus',check);document.addEventListener('visibilitychange',check);
  return()=>{active=false;window.clearInterval(timer);window.removeEventListener('focus',check);document.removeEventListener('visibilitychange',check);};
 },[]);
 useEffect(()=>{if(!verified)return;const timer=window.setTimeout(()=>router.replace('/dashboard?welcome=verified'),2000);return()=>window.clearTimeout(timer);},[verified,router]);
 return <main className="auth-page"><section className="auth-card"><h1>{verified?'Pendaftaran akun berhasil':'Periksa email Anda'}</h1><p role="status">{verified?'Email Anda sudah terverifikasi. Anda akan diarahkan ke dashboard.':'Tautan verifikasi telah diminta. Buka email dari MASAJIDALLOH PRO, lalu klik tautan verifikasi pada browser yang sama. Periksa folder Spam jika belum terlihat.'}</p><p>{verified?'Selanjutnya Anda dapat mendaftarkan Masjid atau menerima undangan Admin tambahan.':'Setelah verifikasi, halaman ini akan melanjutkan secara otomatis saat Anda kembali. Jika Anda memverifikasi di perangkat lain, silakan masuk di sini.'}</p><Link className="plan-button" href={verified?'/dashboard':'/login'}>{verified?'Buka Dashboard':'Masuk setelah verifikasi'}</Link></section></main>;
}
