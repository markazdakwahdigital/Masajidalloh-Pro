'use client';
import {useEffect} from 'react';
import Link from 'next/link';

export default function DashboardError({error,reset}:{error:Error & {digest?:string};reset:()=>void}) {
 useEffect(()=>{
   // Never log user tokens or form fields; only a generic diagnostic for developers.
   console.error('[MASAJIDALLOH PRO] Dashboard failed to render',error.name,error.message);
 },[error]);
 return <main style={{minHeight:'100dvh',display:'grid',placeItems:'center',padding:20,background:'linear-gradient(140deg,#06245f,#0e4b9b)'}}>
   <section role="alert" style={{background:'#fff',border:'2px solid #d8ad43',borderRadius:20,maxWidth:520,width:'100%',padding:28,textAlign:'center',boxShadow:'0 20px 50px #001b4b66'}}>
     <h1 style={{color:'#17396e',fontSize:23}}>Dashboard belum berhasil ditampilkan</h1>
     <p style={{color:'#516c8d',lineHeight:1.7}}>Sesi login Anda mungkin sudah berhasil. Ada gangguan sementara saat membuka halaman dashboard. Silakan coba ulang atau masuk kembali melalui halaman login.</p>
     <button type="button" onClick={reset} style={{padding:'12px 20px',fontWeight:800,color:'#092e6d',border:'1px solid #bd8a27',background:'linear-gradient(#fff3ad,#d7a02b)',borderRadius:12,cursor:'pointer'}}>Coba tampilkan kembali</button>
     <p><Link href="/login" style={{color:'#1457a6'}}>Kembali ke Login</Link></p>
   </section>
 </main>;
}
