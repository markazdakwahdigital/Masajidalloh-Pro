'use server';
import {revalidatePath} from 'next/cache';
import {dataRpc} from '@/lib/server/data-api';
import {checkDkmPhoto} from '@/lib/dkm-photo';
import {dkmDriveConfigured,storeDkmPhoto} from '@/lib/server/dkm-drive';
import {validateModule,type ModuleData,type ModuleRecord,type WorkspaceSettings} from '@/lib/mosque-workspace';
import type {SaveResult} from '@/app/components/workspace-provider';
export async function saveWorkspace(mosqueId:string,kind:string,input:ModuleData,attachment?:FormData,recordId?:string):Promise<SaveResult>{
 try{
  const checked=validateModule(kind,input);
  if(!checked.data||['dashboard','laporan'].includes(kind))return {ok:false,message:checked.error||'Formulir tidak valid.'};
  const attached=attachment?.get('photo'),photo=attached instanceof File&&attached.size?attached:undefined;
  if(photo){
   const error=checkDkmPhoto(photo.size,photo.type,new Uint8Array(await photo.arrayBuffer()));
   if(error||kind!=='dkm')return {ok:false,message:error||'Foto hanya untuk Pengurus DKM.'};
   if(!dkmDriveConfigured())return {ok:false,message:'Unggah Google Drive belum aktif. Biodata dapat disimpan tanpa foto.'};
  }
  if(recordId&&kind==='dkm'){const current=await dataRpc<{records:ModuleRecord[]}>('mp_workspace',{p_mosque:mosqueId});const previous=current.records.find(row=>row.id===recordId&&row.kind==='dkm');if(typeof previous?.data.photoId==='string')checked.data.photoId=previous.data.photoId;}
  const result=await dataRpc<{record?:ModuleRecord;settings?:WorkspaceSettings}>('mp_save_record',{p_mosque:mosqueId,p_kind:kind,p_data:checked.data,p_id:recordId||null});
  let message='Data Masjid berhasil disimpan.';
  if(photo&&result.record){
   try{
    const photoId=await storeDkmPhoto(photo,mosqueId,result.record.id);
    const updated=await dataRpc<{record:ModuleRecord}>('mp_save_record',{p_mosque:mosqueId,p_kind:kind,p_id:result.record.id,p_data:{...result.record.data,photoId}});
    result.record=updated.record;message='Biodata dan foto DKM berhasil disimpan.';
   }catch{message='Biodata tersimpan. Foto belum berhasil ditautkan; periksa Google Drive sebelum mengirim ulang.';}
  }
  revalidatePath('/dashboard/masjid/'+mosqueId);return {ok:true,message,...result};
 }catch{return {ok:false,message:'Data tidak disimpan. Pastikan akun adalah satu Admin terdaftar pada Masjid aktif dan menu termasuk paketnya.'};}
}
export async function archiveRecord(mosqueId:string,id:string):Promise<SaveResult>{
 try{await dataRpc('mp_archive_record',{p_mosque:mosqueId,p_id:id});revalidatePath('/dashboard/masjid/'+mosqueId);return {ok:true,message:'Data diarsipkan dari laporan aktif.'};}
 catch{return {ok:false,message:'Data tidak dapat diarsipkan.'};}
}
