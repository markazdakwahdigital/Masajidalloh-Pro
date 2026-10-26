'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {useWorkspace} from './workspace-provider';
import {selectChair,chairPhotoUrl} from '@/lib/chair-profile';
import {PRAYER_NAMES,zoneLabel} from '@/lib/prayer-times';
import {usePrayer} from './prayer-provider';
import PrayerLocationControls from './prayer-location-controls';
type Result = {label:string;href:string};
type Props = {mosqueName?:string;profileName?:string;profileRole?:string;profileImageSrc?:string;profileRecordId?:string;mosqueId?:string;logo?:string;searchItems:Result[];logout?:boolean;backHref?:string};
const SALAT=PRAYER_NAMES;
function safeHijri(d:Date,tz:string):string {
 try { return new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura',{timeZone:tz,day:'numeric',month:'long',year:'numeric'}).format(d); }
 catch { return 'Tanggal Hijriah belum tersedia'; }
}
function dateParts(d:Date,tz:string){
 return {
  greg:new Intl.DateTimeFormat('id-ID',{timeZone:tz,weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(d),
  hijri:safeHijri(d,tz),
  time:new Intl.DateTimeFormat('id-ID',{timeZone:tz,hour:'2-digit',minute:'2-digit',hour12:false}).format(d),
  key:new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(d)
 };
}
export default function ControlToolbar({mosqueName,profileName,profileRole,profileImageSrc,profileRecordId,mosqueId,searchItems,logout,backHref}:Props){
 const {records,canWrite,preview}=useWorkspace();const chair=canWrite||preview?selectChair(records):undefined;
 const shownName=chair?String(chair.data.name):mosqueId&&canWrite?'Ketua DKM belum diisi':profileName;
 const shownRole=mosqueId||chair?'Ketua DKM':profileRole;
 const photo=mosqueId&&canWrite?(chair?(chairPhotoUrl(mosqueId,chair.data.photoId)||(chair.id===profileRecordId?profileImageSrc:undefined)):undefined):profileImageSrc;
 const [failedPhoto,setFailedPhoto]=useState('');
 const hasPhoto=Boolean(photo&&photo!==failedPhoto);
 const [now,setNow]=useState<Date|null>(null);
 const prayer=usePrayer();const {timings}=prayer;
 const [q,setQ]=useState('');
 const [showSalat,setShowSalat]=useState(false);
 const [openProfile,setOpenProfile]=useState(false);
 useEffect(()=>{
  setNow(new Date());
  const n=window.setInterval(()=>setNow(new Date()),60_000);
  return()=>window.clearInterval(n);
 },[]);
 const tz=prayer.userTimeZone;
 const dates=now?dateParts(now,tz):null;
 const results=useMemo(()=>!q.trim()?[]:searchItems.filter(x=>x.label.toLocaleLowerCase('id').includes(q.trim().toLocaleLowerCase('id'))).slice(0,7),[q,searchItems]);
 const initial=(shownName||'DKM').split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();
 return <header className={'mdd-toolbar'+(mosqueId?' tenant-toolbar':'')}>
   {!mosqueId&&<div className="mdd-compact-brand"><Image src="/brand/logo.webp?v=3" alt="MASAJIDALLOH PRO" width={40} height={40} unoptimized/><span>MASAJIDALLOH <b>PRO</b></span></div>}
   <div className="mdd-search">
    <span aria-hidden="true">⌕</span><label className="sr-only" htmlFor="mdd-search-input">Cari menu dan kegiatan</label>
    <input id="mdd-search-input" placeholder={mosqueName?'Cari jamaah, donasi, program, laporan...':'Cari menu, Masjid, kegiatan...'} value={q} onChange={e=>setQ(e.target.value)}/>
    {q&&<button type="button" className="mdd-x" aria-label="Bersihkan pencarian" onClick={()=>setQ('')}>×</button>}
    {q&&<div className="mdd-search-results" role="status">
      {results.length?results.map((x,i)=><Link onClick={()=>setQ('')} key={i} href={x.href}>{x.label} <span>↗</span></Link>):<p>Tidak ada menu atau kegiatan yang cocok.</p>}
    </div>}
   </div>
   <div className="mdd-date" title="Tanggal Hijriah berdasarkan kalender perhitungan Umm al-Qura; dapat berbeda dari penetapan resmi.">
     <span className="mdd-gold-icon">▦</span>
     <div><strong>{dates?.greg||'Memuat tanggal...'}</strong><small>{dates?.hijri||'Kalender Hijriah'} · {dates?.time||'--:--'} {zoneLabel(tz)}</small></div>
   </div>
   <div className="mdd-prayer-widget">
     <button className="mdd-prayer-toggle" type="button" aria-expanded={showSalat} onClick={()=>setShowSalat(!showSalat)}><span className="mdd-gold-icon">☪</span><span><strong>Waktu Salat</strong><small>{prayer.label+' · '+zoneLabel(prayer.timeZone)}</small></span><span aria-hidden="true">⌄</span></button>
     {showSalat&&<div className="mdd-popup mdd-prayer-popup">
       <PrayerLocationControls id="mdd-prayer-city"/>
       {timings?<div className="prayer-time-list">{SALAT.map(([name,key])=><div key={key}><span>{name}</span><strong>{timings[key]||'—'}</strong></div>)}</div>:<p className="prayer-hint" role="status">{prayer.status}</p>}
       <small className="prayer-credit">Sumber: AlAdhan, metode Kemenag (20). Periksa dengan jadwal resmi Masjid setempat.</small>
     </div>}
   </div>
   <div className="mdd-profile">
     <button type="button" className="mdd-profile-toggle" aria-expanded={openProfile} onClick={()=>setOpenProfile(!openProfile)}>
       <span className="mdd-avatar">{hasPhoto?<Image src={photo!} alt={'Foto Ketua DKM: '+shownName} width={40} height={40} unoptimized onError={()=>setFailedPhoto(photo!)}/>:<span aria-label="Inisial Ketua DKM; foto belum tersedia">{initial}</span>}</span>
       <span className="mdd-profile-copy"><strong>{shownName||'Ketua DKM belum diisi'}</strong><small>{shownRole||'Ketua DKM'}</small></span><span aria-hidden="true">⌄</span>
     </button>
     {openProfile&&<div className="mdd-popup mdd-profile-popup"><strong>{shownName||'Ketua DKM belum diisi'}</strong><p>{shownRole||'Ketua DKM'}</p>{hasPhoto?<Image className="mdd-chair-photo" src={photo!} alt={'Foto Ketua DKM: '+shownName} width={80} height={80} unoptimized onError={()=>setFailedPhoto(photo!)}/>:<p>{photo?'Foto Ketua DKM belum dapat dimuat.':'Foto Ketua DKM belum diunggah.'}</p>}{backHref&&<Link href={backHref}>← Daftar Masjid</Link>}{logout&&<Link href="/dashboard">Dashboard saya</Link>}</div>}
   </div>
  </header>;
}
