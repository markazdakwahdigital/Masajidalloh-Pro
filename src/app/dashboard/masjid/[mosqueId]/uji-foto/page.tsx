import Link from 'next/link';
import {redirect} from 'next/navigation';
import {randomUUID} from 'node:crypto';
import {dataRpc} from '@/lib/server/data-api';
import {storeDkmPhoto,dkmDriveConfigured} from '@/lib/server/dkm-drive';
export const dynamic='force-dynamic';
async function checkUpload(mosqueId:string){
 'use server';
 let fileId='';
 try{
  const current=await dataRpc<{canWrite:boolean}>('mp_workspace',{p_mosque:mosqueId});
  if(!current.canWrite)throw new Error();
  const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC','base64');
  fileId=await storeDkmPhoto(new File([bytes],'uji-koneksi.png',{type:'image/png'}),mosqueId,randomUUID());
 }catch{redirect('/dashboard/masjid/'+mosqueId+'/uji-foto?status=failed');}
 redirect('/dashboard/masjid/'+mosqueId+'/uji-foto?status=ok&file='+encodeURIComponent(fileId));
}
export default async function UploadCheck({params,searchParams}:{params:Promise<{mosqueId:string}>;searchParams:Promise<{status?:string;file?:string}>}){
 const {mosqueId}=await params,{status,file}=await searchParams;
 try{const current=await dataRpc<{canWrite:boolean}>('mp_workspace',{p_mosque:mosqueId});if(!current.canWrite)throw new Error();}catch{return <main className="auth-page"><section className="auth-card"><h1>Khusus Admin Masjid</h1><Link href={'/dashboard/masjid/'+mosqueId}>Dashboard Masjid</Link></section></main>;}
 return <main className="auth-page"><section className="auth-card"><h1>Periksa Unggah Foto DKM</h1><p>Pengujian mengirim satu gambar kecil ke folder Drive privat. Biodata Pengurus tidak diubah. File uji dapat dipindahkan ke Sampah setelah diperiksa.</p>{!dkmDriveConfigured()&&<p role="alert">Koneksi unggah belum dikonfigurasi.</p>}{status==='ok'?<div role="status"><p>Berhasil. Server aplikasi sudah mengirim gambar ke Google Drive.</p>{file&&/^[-\w]{10,200}$/.test(file)&&<a href={'https://drive.google.com/file/d/'+file+'/view'} target="_blank" rel="noopener noreferrer">Periksa file uji di Drive</a>}</div>:status==='failed'&&<p role="alert">Pengujian belum berhasil. Periksa koneksi Drive dan konfigurasi server.</p>}<form action={checkUpload.bind(null,mosqueId)}><button type="submit" disabled={!dkmDriveConfigured()}>Uji Unggah Gambar Kecil</button></form><p><Link href={'/dashboard/masjid/'+mosqueId+'#profil'}>Kembali ke Profile Masjid</Link></p></section></main>;
}
