'use client';
import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import {checkDkmPhoto} from '@/lib/dkm-photo';
import { validateModule, hasModule, type PackagePlan, type ModuleData, type ModuleRecord, type WorkspaceSettings } from '@/lib/mosque-workspace';
export type SaveResult={ok:boolean;message:string;record?:ModuleRecord;settings?:WorkspaceSettings};
export type WorkspaceProps={plan?:PackagePlan;records?:ModuleRecord[];settings?:WorkspaceSettings;preview?:boolean;canWrite?:boolean;saveAction?:(kind:string,data:ModuleData,photo?:FormData)=>Promise<SaveResult>};
type State={plan:PackagePlan;records:ModuleRecord[];settings:WorkspaceSettings;preview:boolean;canWrite:boolean;save:(kind:string,data:ModuleData,photo?:File)=>Promise<SaveResult>};
const Context=createContext<State|null>(null);
export function useWorkspace(){const context=useContext(Context);if(!context)throw new Error('Workspace provider missing');return context;}
export default function WorkspaceProvider({children,plan='BASIC',records:initialRecords=[],settings:initialSettings={},preview=false,canWrite=false,saveAction}:WorkspaceProps&{children:ReactNode}){
 const photoUrls=useRef<string[]>([]);
 useEffect(()=>()=>{photoUrls.current.forEach(url=>URL.revokeObjectURL(url));},[]);
 const [records,setRecords]=useState(initialRecords);
 const [settings,setSettings]=useState(initialSettings);
 async function save(kind:string,input:ModuleData,photo?:File):Promise<SaveResult>{
  if(!hasModule(plan,kind))return {ok:false,message:'Menu ini tidak termasuk paket Masjid.'};
  if(!preview&&!canWrite)return {ok:false,message:'Akun Anda tidak memiliki izin mengubah data ini.'};
  if(photo){const error=checkDkmPhoto(photo.size,photo.type);if(error||kind!=='dkm')return {ok:false,message:error||'Foto hanya untuk Pengurus DKM.'};}
  const checked=validateModule(kind,input);if(!checked.data)return {ok:false,message:checked.error||'Periksa formulir.'};
  let result:SaveResult;
  if(preview){
   result=['profil','setting'].includes(kind)?{ok:true,message:'Pengaturan pratinjau diperbarui. Tidak tersimpan ke akun Masjid.',settings:{...settings,...checked.data} as WorkspaceSettings}:{ok:true,message:'Data pratinjau ditambahkan. Data hilang saat halaman dimuat ulang.',record:{id:crypto.randomUUID(),kind,data:checked.data,createdAt:new Date().toISOString()}};
  }else{
   if(!saveAction)return {ok:false,message:'Pilih Masjid terlebih dahulu untuk menyimpan data.'};
   try{const attachment=photo?new FormData():undefined;if(attachment&&photo)attachment.set('photo',photo);result=await saveAction(kind,checked.data,attachment);}catch{return {ok:false,message:'Data belum berhasil disimpan. Periksa koneksi layanan Masjid.'};}
  }
  if(preview&&result.ok&&result.record&&photo){const url=URL.createObjectURL(photo);photoUrls.current.push(url);result.record.data.photoPreview=url;}
  if(result.ok&&result.settings)setSettings(result.settings);
  if(result.ok&&result.record)setRecords(previous=>[result.record!,...previous]);
  return result;
 }
 return <Context.Provider value={{plan,records,settings,preview,canWrite:preview||canWrite,save}}>{children}</Context.Provider>;
}
