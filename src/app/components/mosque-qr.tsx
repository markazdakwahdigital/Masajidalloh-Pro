'use client';
import Image from 'next/image';
import {useEffect,useState} from 'react';
import InstallApp from '@/app/install-app';
import {publicMosqueUrl} from '@/lib/tenant-public-app';
export default function MosqueQr({mosqueId,name}:{mosqueId:string;name:string}){
 const link=publicMosqueUrl(mosqueId),src='/api/masjid/'+mosqueId+'/qr';
 const [file,setFile]=useState<File|null>(null),[message,setMessage]=useState(''),[failed,setFailed]=useState(false);
 useEffect(()=>{
  const abort=new AbortController();
  fetch(src,{signal:abort.signal}).then(async response=>{if(!response.ok||!response.headers.get('content-type')?.startsWith('image/png'))return;const blob=await response.blob();if(!abort.signal.aborted)setFile(new File([blob],'QR-Masjid-'+mosqueId+'.png',{type:'image/png'}));}).catch(()=>{/* The displayed QR and download link remain available. */});
  return()=>abort.abort();
 },[src,mosqueId]);
 async function share(){
  const title='Aplikasi '+name,text='Pindai QR Code untuk membuka dashboard publik '+name+' tanpa login.';
  try{
   if(navigator.share){
    const data:ShareData=file&&navigator.canShare?.({files:[file]})?{title,text,files:[file]}:{title,text,url:link};
    await navigator.share(data);return;
   }
   await navigator.clipboard.writeText(link);setMessage('Tautan aplikasi disalin. Untuk membagikan gambar, pilih Unduh QR Code.');
  }catch(error){if(!(error instanceof Error&&error.name==='AbortError'))setMessage('Gunakan Unduh QR Code untuk menyimpan dan membagikan gambar, atau salin tautan aplikasi di bawah.');}
 }
 return <section className="brochure-panel mosque-qr-panel" aria-labelledby="mosque-qr-title"><div className="mosque-qr-image">{failed?<p>QR Code belum dapat dimuat. Silakan muat ulang halaman.</p>:<Image src={src} alt={'QR Code aplikasi '+name} width={250} height={250} unoptimized onError={()=>setFailed(true)}/>}<strong>{name}</strong></div><div className="mosque-qr-copy"><h2 id="mosque-qr-title">QR Code Aplikasi Masjid</h2><p>Pindai dengan kamera ponsel untuk melihat dashboard dan laporan {name}. Terbuka untuk Jamaah dan masyarakat umum tanpa login atau mendaftar.</p><div className="mosque-qr-actions"><a href={src+'?download=1'} download={'QR-Masjid-'+mosqueId+'.png'}>Unduh QR Code</a><button type="button" onClick={share}>Bagikan QR Code</button></div>{message&&<p role="status">{message}</p>}<a className="mosque-qr-link" href={link}>Buka aplikasi {name} ↗</a><InstallApp name={name}/></div></section>;
}
