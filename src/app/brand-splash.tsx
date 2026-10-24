'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function BrandSplash(){
  const [visible,setVisible]=useState(true);
  useEffect(()=>{const timer=window.setTimeout(()=>setVisible(false),1300);return()=>window.clearTimeout(timer);},[]);
  if(!visible)return null;
  return <div className="brand-splash" aria-hidden="true"><Image src="/brand/logo.webp?v=3" alt="" width={300} height={300} priority unoptimized/><span>Developed by MARKAZ DAKWAH DIGITAL</span></div>;
}
