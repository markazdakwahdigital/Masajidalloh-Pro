'use client';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { validateModule, hasModule, type PackagePlan, type ModuleData, type ModuleRecord, type WorkspaceSettings } from '@/lib/mosque-workspace';
export type SaveResult={ok:boolean;message:string;record?:ModuleRecord;settings?:WorkspaceSettings};
export type WorkspaceProps={plan?:PackagePlan;records?:ModuleRecord[];settings?:WorkspaceSettings;preview?:boolean;canWrite?:boolean;saveAction?:(kind:string,data:ModuleData)=>Promise<SaveResult>};
type State={plan:PackagePlan;records:ModuleRecord[];settings:WorkspaceSettings;preview:boolean;canWrite:boolean;save:(kind:string,data:ModuleData)=>Promise<SaveResult>};
const Context=createContext<State|null>(null);
export function useWorkspace(){const context=useContext(Context);if(!context)throw new Error('Workspace provider missing');return context;}
export default function WorkspaceProvider({children,plan='BASIC',records:initialRecords=[],settings:initialSettings={},preview=false,canWrite=false,saveAction}:WorkspaceProps&{children:ReactNode}){
 const [records,setRecords]=useState(initialRecords);
 const [settings,setSettings]=useState(initialSettings);
 async function save(kind:string,input:ModuleData):Promise<SaveResult>{
  if(!hasModule(plan,kind))return {ok:false,message:'Menu ini tidak termasuk paket Masjid.'};
  if(!preview&&!canWrite)return {ok:false,message:'Akun Anda tidak memiliki izin mengubah data ini.'};
  const checked=validateModule(kind,input);if(!checked.data)return {ok:false,message:checked.error||'Periksa formulir.'};
  let result:SaveResult;
  if(preview){
   result=['profil','setting'].includes(kind)?{ok:true,message:'Pengaturan pratinjau diperbarui. Tidak tersimpan ke akun Masjid.',settings:{...settings,...checked.data} as WorkspaceSettings}:{ok:true,message:'Data pratinjau ditambahkan. Data hilang saat halaman dimuat ulang.',record:{id:crypto.randomUUID(),kind,data:checked.data,createdAt:new Date().toISOString()}};
  }else{
   if(!saveAction)return {ok:false,message:'Pilih Masjid terlebih dahulu untuk menyimpan data.'};
   try{result=await saveAction(kind,checked.data);}catch{return {ok:false,message:'Data belum berhasil disimpan. Periksa koneksi layanan Masjid.'};}
  }
  if(result.ok&&result.settings)setSettings(result.settings);
  if(result.ok&&result.record)setRecords(previous=>[result.record!,...previous]);
  return result;
 }
 return <Context.Provider value={{plan,records,settings,preview,canWrite:preview||canWrite,save}}>{children}</Context.Provider>;
}
