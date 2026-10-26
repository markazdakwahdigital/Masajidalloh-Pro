import 'server-only';
import {createHmac,randomUUID} from 'node:crypto';
import {checkDkmPhoto} from '@/lib/dkm-photo';
export function dkmDriveConfigured(){return Boolean(process.env.DKM_DRIVE_WEB_APP_URL&&process.env.DKM_DRIVE_SIGNING_KEY);}
export async function storeDkmPhoto(file:File,mosqueId:string,recordId:string){
 const bytes=new Uint8Array(await file.arrayBuffer());
 const error=checkDkmPhoto(file.size,file.type,bytes);if(error)throw new Error(error);
 const endpoint=process.env.DKM_DRIVE_WEB_APP_URL,key=process.env.DKM_DRIVE_SIGNING_KEY;
 if(!endpoint||!key)throw new Error('Unggah foto belum aktif. Hubungkan Google Drive markazdakwahdigital.01@gmail.com terlebih dahulu.');
 const url=new URL(endpoint);if(url.protocol!=='https:'||url.hostname!=='script.google.com'||!/^\/macros\/s\/[\w-]+\/exec$/.test(url.pathname))throw new Error('Konfigurasi Google Drive tidak valid.');
 const payload=JSON.stringify({nonce:randomUUID(),timestamp:Date.now(),mosqueId,recordId,mimeType:file.type,base64:Buffer.from(bytes).toString('base64')});
 const signature=createHmac('sha256',key).update(payload).digest('hex');
 const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({payload,signature}),signal:AbortSignal.timeout(25000)});
 if(!response.ok)throw new Error('Google Drive belum menerima foto. Silakan coba lagi.');
 const result=await response.json() as {ok?:boolean;fileId?:string};
 if(!result.ok||!result.fileId||!/^[-\w]{10,200}$/.test(result.fileId))throw new Error('Foto belum tersimpan ke Google Drive. Periksa koneksi akun dan izin folder.');
 return result.fileId;
}

export async function readDkmPhoto(mosqueId:string,recordId:string,fileId:string){
 const endpoint=process.env.DKM_DRIVE_WEB_APP_URL,key=process.env.DKM_DRIVE_SIGNING_KEY;
 if(!endpoint||!key||!/^[-\w]{10,200}$/.test(fileId))throw new Error('Foto belum tersedia.');
 const url=new URL(endpoint);if(url.protocol!=='https:'||url.hostname!=='script.google.com'||!/^\/macros\/s\/[\w-]+\/exec$/.test(url.pathname))throw new Error('Konfigurasi Drive tidak valid.');
 const payload=JSON.stringify({operation:'read',nonce:randomUUID(),timestamp:Date.now(),mosqueId,recordId,fileId});
 const signature=createHmac('sha256',key).update(payload).digest('hex');
 const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({payload,signature}),signal:AbortSignal.timeout(25000),cache:'no-store'});
 if(!response.ok)throw new Error('Foto belum tersedia.');
 const result=await response.json() as {ok?:boolean;mimeType?:string;base64?:string};
 if(!result.ok||!result.mimeType||typeof result.base64!=='string'||result.base64.length>2800000)throw new Error('Foto belum tersedia.');
 const bytes=new Uint8Array(Buffer.from(result.base64,'base64'));if(checkDkmPhoto(bytes.length,result.mimeType,bytes))throw new Error('Foto tidak valid.');
 return {bytes,mimeType:result.mimeType};
}
