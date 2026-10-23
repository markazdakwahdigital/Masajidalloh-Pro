'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
type Result = {label:string;href:string};
type Props = {mosqueName?:string;profileName?:string;profileRole?:string;logo?:string;searchItems:Result[];logout?:boolean;backHref?:string};
type Salah = {name:string;time:string};
const CITY_OPTIONS = [
 {name:'Bogor',tz:'Asia/Jakarta'},{name:'Jakarta',tz:'Asia/Jakarta'},{name:'Bandung',tz:'Asia/Jakarta'},
 {name:'Semarang',tz:'Asia/Jakarta'},{name:'Yogyakarta',tz:'Asia/Jakarta'},{name:'Surabaya',tz:'Asia/Jakarta'},
 {name:'Medan',tz:'Asia/Jakarta'},{name:'Makassar',tz:'Asia/Makassar'},{name:'Denpasar',tz:'Asia/Makassar'},
 {name:'Balikpapan',tz:'Asia/Makassar'},{name:'Jayapura',tz:'Asia/Jayapura'}
];
const SALAT=[['Subuh','Fajr'],['Dzuhur','Dhuhr'],['Ashar','Asr'],['Maghrib','Maghrib'],['Isya','Isha']];
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
export default function ControlToolbar({mosqueName,profileName,profileRole,searchItems,logout,backHref}:Props){
 const [now,setNow]=useState<Date|null>(null);
 const [city,setCity]=useState('');
 const [timings,setTimings]=useState<Record<string,string>|null>(null);
 const [error,setError]=useState('');
 const [q,setQ]=useState('');
 const [showSalat,setShowSalat]=useState(false);
 const [openProfile,setOpenProfile]=useState(false);
 useEffect(()=>{
  setNow(new Date());
  const n=window.setInterval(()=>setNow(new Date()),60_000);
  // Browser storage can throw in privacy-restricted PWAs; it must not crash the dashboard.
  try {
    const stored=window.localStorage.getItem('mdd-mosque-prayer-city');
    if(stored&&CITY_OPTIONS.some(x=>x.name===stored)) setCity(stored);
  } catch { /* Fall back to requiring a city selection. */ }
  return()=>window.clearInterval(n);
 },[]);
 const tz=CITY_OPTIONS.find(c=>c.name===city)?.tz||'Asia/Jakarta';
 const dates=now?dateParts(now,tz):null;
 useEffect(()=>{
  if(!city||!dates?.key){setTimings(null);return;}
  let live=true;
  setError('');setTimings(null);
  const controller=new AbortController();
  fetch('/api/prayer-times?city='+encodeURIComponent(city),{signal:controller.signal})
   .then(async r=>{if(!r.ok)throw new Error('Jadwal belum tersedia');return r.json() as Promise<{timings:Record<string,string>}>})
   .then(data=>{if(live)setTimings(data.timings);})
   .catch(()=>{if(live)setError('Jadwal salat belum tersedia. Coba kembali.');});
  return()=>{live=false;controller.abort();};
 },[city,dates?.key]);
 const results=useMemo(()=>!q.trim()?[]:searchItems.filter(x=>x.label.toLocaleLowerCase('id').includes(q.trim().toLocaleLowerCase('id'))).slice(0,7),[q,searchItems]);
 const initial=(profileName||'DKM').split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();
 return <header className="mdd-toolbar">
   <div className="mdd-compact-brand"><Image src="/brand/logo.webp?v=2" alt="MASAJIDALLOH PRO" width={40} height={40} unoptimized/><span>MASAJIDALLOH <b>PRO</b></span></div>
   <div className="mdd-search">
    <span aria-hidden="true">⌕</span><label className="sr-only" htmlFor="mdd-search-input">Cari menu dan kegiatan</label>
    <input id="mdd-search-input" placeholder="Cari menu, masjid, kegiatan..." value={q} onChange={e=>setQ(e.target.value)} aria-expanded={results.length>0}/>
    {q&&<button type="button" className="mdd-x" aria-label="Bersihkan pencarian" onClick={()=>setQ('')}>×</button>}
    {q&&<div className="mdd-search-results" role="status">
      {results.length?results.map((x,i)=><Link onClick={()=>setQ('')} key={i} href={x.href}>{x.label} <span>↗</span></Link>):<p>Tidak ada menu atau kegiatan yang cocok.</p>}
    </div>}
   </div>
   <div className="mdd-date" title="Tanggal Hijriah berdasarkan kalender perhitungan Umm al-Qura; dapat berbeda dari penetapan resmi.">
     <span className="mdd-gold-icon">▦</span>
     <div><strong>{dates?.greg||'Memuat tanggal...'}</strong><small>{dates?.hijri||'Kalender Hijriah'} · {dates?.time||'--:--'}</small></div>
   </div>
   <div className="mdd-prayer-widget">
     <button className="mdd-prayer-toggle" type="button" aria-expanded={showSalat} onClick={()=>setShowSalat(!showSalat)}><span className="mdd-gold-icon">☪</span><span><strong>Waktu Salat</strong><small>{city?city+' · '+(timings?'Jadwal hari ini':'Memuat...'):'Pilih kota masjid'}</small></span><span aria-hidden="true">⌄</span></button>
     {showSalat&&<div className="mdd-popup mdd-prayer-popup">
       <label htmlFor="mdd-prayer-city">Lokasi untuk jadwal salat</label>
       <select id="mdd-prayer-city" value={city} onChange={e=>{setCity(e.target.value);try{window.localStorage.setItem('mdd-mosque-prayer-city',e.target.value);}catch{/* Storage disabled */}}}><option value="">Pilih kota...</option>{CITY_OPTIONS.map(c=><option key={c.name}>{c.name}</option>)}</select>
       {timings?<div className="prayer-time-list">{SALAT.map(([name,key])=><div key={key}><span>{name}</span><strong>{timings[key]||'—'}</strong></div>)}</div>:<p className="prayer-hint">{error||'Pilih lokasi masjid agar jadwal ditampilkan. Jam dihitung menurut kota yang dipilih.'}</p>}
       <small className="prayer-credit">Sumber: AlAdhan, metode Kemenag (20). Periksa dengan jadwal resmi masjid setempat.</small>
     </div>}
   </div>
   <div className="mdd-profile">
     <button type="button" className="mdd-profile-toggle" aria-expanded={openProfile} onClick={()=>setOpenProfile(!openProfile)}>
       <span className="mdd-avatar" aria-label="Avatar inisial; foto profil belum tersedia">{initial}</span>
       <span className="mdd-profile-copy"><strong>{profileName||'Belum ditetapkan'}</strong><small>{profileRole||'Ketua DKM · belum ditetapkan'}</small></span><span aria-hidden="true">⌄</span>
     </button>
     {openProfile&&<div className="mdd-popup mdd-profile-popup"><strong>{profileName||'Ketua DKM belum ditetapkan'}</strong><p>{profileRole||'Identitas dan foto Ketua DKM belum tersedia dalam profil masjid.'}</p><p>Foto profil akan ditampilkan setelah fitur unggah foto pengurus tersedia.</p>{backHref&&<Link href={backHref}>← Daftar masjid</Link>}{logout&&<Link href="/dashboard">Dashboard saya</Link>}</div>}
   </div>
  </header>;
}
