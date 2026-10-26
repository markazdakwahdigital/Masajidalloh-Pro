'use client';
import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import {checkDkmPhoto} from '@/lib/dkm-photo';
import { validateModule, hasModule, type PackagePlan, type ModuleData, type ModuleRecord, type WorkspaceSettings } from '@/lib/mosque-workspace';
export type SaveResult={ok:boolean;message:string;record?:ModuleRecord;settings?:WorkspaceSettings};
export type WorkspaceProps={plan?:PackagePlan;records?:ModuleRecord[];settings?:WorkspaceSettings;preview?:boolean;photoUploadEnabled?:boolean;readOnly?:boolean;canWrite?:boolean;archiveAction?:(id:string)=>Promise<SaveResult>;saveAction?:(kind:string,data:ModuleData,photo?:FormData,recordId?:string)=>Promise<SaveResult>};
type State={plan:PackagePlan;records:ModuleRecord[];settings:WorkspaceSettings;preview:boolean;photoUploadEnabled:boolean;canWrite:boolean;save:(kind:string,data:ModuleData,photo?:File,recordId?:string)=>Promise<SaveResult>;archive:(id:string)=>Promise<SaveResult>};
const Context=createContext<State|null>(null);
export function useWorkspace(){const context=useContext(Context);if(!context)throw new Error('Workspace provider missing');return context;}
export default function WorkspaceProvider({children,plan='BASIC',records:initialRecords=[],settings:initialSettings={},preview=false,photoUploadEnabled=false,readOnly=false,canWrite=false,saveAction,archiveAction}:WorkspaceProps&{children:ReactNode}){
 const photoUrls=useRef<string[]>([]);
 useEffect(()=>()=>{photoUrls.current.forEach(url=>URL.revokeObjectURL(url));},[]);
 const [records,setRecords]=useState(initialRecords);
 const [settings,setSettings]=useState(initialSettings);
 async function save(kind:string,input:ModuleData,photo?:File,recordId?:string):Promise<SaveResult>{
  if(readOnly)return {ok:false,message:'Pratinjau pembaca tidak dapat mengubah data.'};
  if(!hasModule(plan,kind))return {ok:false,message:'Menu ini tidak termasuk paket Masjid.'};
  if(!preview&&!canWrite)return {ok:false,message:'Akun Anda tidak memiliki izin mengubah data ini.'};
  if(photo){const error=checkDkmPhoto(photo.size,photo.type);if(error||!['dkm','profil'].includes(kind))return {ok:false,message:error||'Gambar hanya untuk Pengurus DKM atau logo Masjid.'};}
  const checked=validateModule(kind,input);if(!checked.data)return {ok:false,message:checked.error||'Periksa formulir.'};
  let result:SaveResult;
  if(preview){
   result=['profil','setting'].includes(kind)?{ok:true,message:'Pengaturan pratinjau diperbarui. Tidak tersimpan ke akun Masjid.',settings:{...settings,...checked.data} as WorkspaceSettings}:{ok:true,message:'Data pratinjau ditambahkan. Data hilang saat halaman dimuat ulang.',record:{id:recordId||crypto.randomUUID(),kind,data:{...checked.data,...(recordId&&kind==='dkm'&&records.find(row=>row.id===recordId)?.data.photoPreview?{photoPreview:records.find(row=>row.id===recordId)!.data.photoPreview}:{})},createdAt:new Date().toISOString()}};
  }else{
   if(!saveAction)return {ok:false,message:'Pilih Masjid terlebih dahulu untuk menyimpan data.'};
   try{const attachment=photo?new FormData():undefined;if(attachment&&photo)attachment.set('photo',photo);result=await saveAction(kind,checked.data,attachment,recordId);}catch{return {ok:false,message:'Data belum berhasil disimpan. Periksa koneksi layanan Masjid.'};}
  }
  if(preview&&result.ok&&result.record&&photo){const url=URL.createObjectURL(photo);photoUrls.current.push(url);result.record.data.photoPreview=url;}
  if(preview&&result.ok&&result.settings&&photo&&kind==='profil'){const url=URL.createObjectURL(photo);photoUrls.current.push(url);result.settings.logoPreview=url;}
  if(result.ok&&result.settings)setSettings(result.settings);
  if(result.ok&&result.record)setRecords(previous=>[result.record!,...previous.filter(row=>row.id!==result.record!.id)]);
  return result;
 }
 useEffect(()=>{if(!preview){setRecords(initialRecords);setSettings(initialSettings);}},[initialRecords,initialSettings,preview]);
 async function archive(id:string):Promise<SaveResult>{
  if(readOnly||(!canWrite&&!preview))return {ok:false,message:'Akses pembaca tidak dapat mengarsipkan data.'};
  let result:SaveResult;
  try{result=preview?{ok:true,message:'Data pratinjau dihapus.'}:archiveAction?await archiveAction(id):{ok:false,message:'Pilih Masjid terlebih dahulu.'};}catch{return {ok:false,message:'Data belum dapat diarsipkan.'};}
  if(result.ok)setRecords(previous=>previous.filter(row=>row.id!==id));return result;
 }
 return <Context.Provider value={{plan,records,settings,preview,photoUploadEnabled,canWrite:!readOnly&&(preview||canWrite),save,archive}}>{children}</Context.Provider>;
}
