'use client';
import Image from 'next/image';
import {useState} from 'react';
import {useWorkspace} from './workspace-provider';
export default function MosqueSidebarBrand({mosqueId}:{mosqueId?:string}){
 const {settings}=useWorkspace();
 const [failed,setFailed]=useState('');
 const custom=settings.logoPreview||(mosqueId&&settings.logoPhotoId?'/api/masjid/'+mosqueId+'/logo?v='+encodeURIComponent(settings.logoPhotoId):'');
 const src=custom&&custom!==failed?custom:'/brand/logo.webp?v=3';
 return <div className="side-brand"><Image src={src} alt={src===custom?'Logo '+(settings.name||'Masjid'):'MASAJIDALLOH PRO'} width={210} height={205} className="brand-mark-large" unoptimized onError={()=>setFailed(src)}/></div>;
}
