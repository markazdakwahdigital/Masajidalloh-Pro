'use client';
import { useEffect, useState } from 'react';
import { MenuIcon } from './enterprise-navigation';
import {useWorkspace} from './workspace-provider';
import {summarize,dateKey,hasModule} from '@/lib/mosque-workspace';

function Heading({icon,title,children}:{icon:number;title:string;children?:React.ReactNode}){
 return <div className="brochure-panel-heading"><span className="gold-tile"><MenuIcon index={icon}/></span><h2>{title}</h2>{children}</div>;
}
function PrayerSchedule(){
 const {records,settings}=useWorkspace();
 const configuredCity=String(records.find(row=>row.kind==='shalat')?.data.city||settings.city||'');
 const [city,setCity]=useState('');
 useEffect(()=>{if(configuredCity)setCity(configuredCity);},[configuredCity]);
 const [times,setTimes]=useState<Record<string,string>>({});
 const [status,setStatus]=useState('Pilih kota Masjid untuk melihat jadwal.');
 useEffect(()=>{
  if(!city)return;
  const controller=new AbortController();setTimes({});setStatus('Memuat jadwal…');
  fetch('/api/prayer-times?city='+encodeURIComponent(city),{signal:controller.signal})
   .then(async response=>{if(!response.ok)throw new Error();return response.json();})
   .then(data=>{setTimes(data.timings);setStatus('Sumber: AlAdhan · metode Kemenag.');})
   .catch(()=>{if(!controller.signal.aborted)setStatus('Jadwal belum tersedia. Silakan pilih kota lagi.');});
  return()=>controller.abort();
 },[city]);
 return <section className="brochure-panel" id="jadwal-hari-ini"><Heading icon={8} title="Jadwal Sholat Hari Ini"/><label className="sr-only" htmlFor="brochure-city">Kota jadwal sholat</label><select id="brochure-city" value={city} onChange={e=>setCity(e.target.value)}><option value="">Pilih kota Masjid</option>{['Jakarta','Bogor','Bandung','Semarang','Yogyakarta','Surabaya','Medan','Makassar','Denpasar','Balikpapan','Jayapura'].map(name=><option key={name}>{name}</option>)}</select><div className="brochure-prayers">{[['☀','Subuh','Fajr'],['☀','Dzuhur','Dhuhr'],['☁','Ashar','Asr'],['☀','Maghrib','Maghrib'],['☾','Isya','Isha']].map(([icon,name,key])=><div key={key}><span aria-hidden="true">{icon}</span><strong>{name}</strong><b>{times[key]||'—'}</b><small>{times[key]?'Jadwal hari ini':'Pilih kota'}</small></div>)}</div><p className="brochure-note" role="status">{status}</p></section>;
}
export default function BrochureOverview({programCount,programs=[]}:{programCount?:number;programs?:Array<{id:string;title:string;date:string}>}){
 const {records,plan,settings,preview}=useWorkspace();
 const [today,setToday]=useState('');
 useEffect(()=>{const refresh=()=>setToday(dateKey(new Date(),settings.timezone));refresh();const timer=setInterval(refresh,60000);return()=>clearInterval(timer);},[settings.timezone]);
 const totals=summarize(records,plan,today);
 const money=(value:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(value);
 const exists=(kind:string)=>records.some(row=>row.kind===kind);
 const cards=[
  {kind:'donasi',tone:'green',icon:6,title:'Saldo Kas Masjid',value:totals.income.length||totals.expenses.length?money(totals.balance):'—'},
  {kind:'keuangan',tone:'red',icon:6,title:'Pengeluaran Hari Ini',value:exists('keuangan')?money(totals.expensesToday):'—'},
  {kind:'donasi',tone:'blue',icon:3,title:'Donasi Hari Ini',value:exists('donasi')?money(totals.donationsToday):'—'},
  {kind:'infaq',tone:'green',icon:3,title:'Infaq & Shodaqoh Hari Ini',value:exists('infaq')?money(totals.infaqToday):'—',detail:totals.infaqNonCashToday?totals.infaqNonCashToday+' penerimaan non-uang hari ini':undefined},
  {kind:'zakat',tone:'red',icon:4,title:'Zakat Terkumpul',value:exists('zakat')?money(totals.zakat):'—'},
  {kind:'wakaf',tone:'teal',icon:5,title:'Wakaf Aktif & Produktif',value:exists('wakaf')?totals.wakaf+' Aset':'—'},
  {kind:'jamaah',tone:'gold',icon:2,title:'Jamaah Aktif',value:exists('jamaah')?totals.jamaah:'—'},
  {kind:'penerima',tone:'blue',icon:15,title:'Penerima Manfaat',value:exists('penerima')?totals.beneficiaries+' Orang':'—'},
  {kind:'kegiatan',tone:'purple',icon:7,title:'Program Berjalan',value:programCount??(exists('kegiatan')?totals.programs:'—')},
 ].filter(card=>hasModule(plan,card.kind));
 const sourceKinds=['donasi','infaq','zakat','wakaf'];
 const sourceNames=['Donasi','Infaq & Shodaqoh','Zakat','Wakaf'];
 const sourceValues=sourceKinds.map(kind=>totals.income.filter(row=>row.kind===kind).reduce((sum,row)=>sum+Number(row.data.amount||0),0));
 const sourceTotal=sourceValues.reduce((a,b)=>a+b,0);
 const colors=['#168bf5','#13ba7d','#ffc233','#9d37ed'];let end=0;
 const gradient=sourceValues.map((value,i)=>{const start=end;end+=sourceTotal?value/sourceTotal*100:0;return colors[i]+' '+start+'% '+end+'%';}).join(',');
 const agenda=[...programs,...records.filter(row=>row.kind==='kegiatan'&&row.data.published).map(row=>({id:row.id,title:String(row.data.title),date:String(row.data.date)}))];
 const financial=hasModule(plan,'donasi');
 return <>
 <section className="brochure-hero"><span className="brochure-hero-icon"><MenuIcon index={6}/></span><div><h1>Dashboard Pengelola Masjid</h1><p>{settings.name||'Kelola Masjid dengan data, kolaborasi dan teknologi'}<br/>untuk umat yang lebih baik.</p></div><blockquote>“Memakmurkan Masjid,<br/>Membangun Umat,<br/>Meraih Ridha Allah”</blockquote></section>
 <p className="brochure-note dashboard-source-note">Paket {plan} · Ringkasan hanya berasal dari input menu {preview?'pratinjau':'Masjid'} yang tercatat. Hari ini mengikuti zona waktu {settings.timezone||'Asia/Jakarta'}.</p>
 <div className="brochure-stats">{cards.map(card=><article className={'brochure-stat '+card.tone} key={card.title}><span className="brochure-stat-orb"><MenuIcon index={card.icon}/></span><div><span>{card.title}</span><strong>{card.value}</strong></div><p>{card.detail||(card.value==='—'?'Belum ada data':'Dari data input yang tercatat')}</p></article>)}</div>
 <div className="brochure-grid">
 {financial&&<section className="brochure-panel"><Heading icon={3} title="Sumber Penerimaan"/><div className="brochure-donation-chart"><div className={'brochure-donut '+(sourceTotal?'has-data':'')} style={sourceTotal?{background:'conic-gradient('+gradient+')',opacity:1}:undefined} role="img" aria-label={sourceTotal?'Diagram penerimaan berdasarkan input':'Belum ada data penerimaan'}><div><small>Total Penerimaan</small><strong>{sourceTotal?money(sourceTotal):'—'}</strong><span>{sourceTotal?'Data tercatat':'Belum ada data'}</span></div></div><ul>{sourceNames.map((name,i)=><li key={name}><i style={{background:colors[i]}}/>{name}<b>{sourceTotal?Math.round(sourceValues[i]/sourceTotal*100)+'%':'—'}</b></li>)}</ul></div></section>}
 {financial&&<section className="brochure-panel"><Heading icon={6} title="Pemasukan & Pengeluaran Hari Ini"/><div className="daily-cash-summary"><p>Pemasukan <strong>{totals.income.length?money(totals.income.filter(row=>row.data.date===today).reduce((sum,row)=>sum+Number(row.data.amount||0),0)):'—'}</strong></p><p>Pengeluaran <strong>{totals.expenses.length?money(totals.expensesToday):'—'}</strong></p><p>Saldo Kas <strong>{totals.income.length||totals.expenses.length?money(totals.balance):'—'}</strong></p></div><p className="brochure-note">Penerimaan non-uang tidak dihitung sebagai kas. Tidak ada angka atau grafik simulasi.</p></section>}
 {hasModule(plan,'shalat')&&<PrayerSchedule/>}
 {hasModule(plan,'kegiatan')&&<section className="brochure-panel"><Heading icon={7} title="Agenda & Kegiatan"><a href="#kegiatan">Lihat Semua</a></Heading><div className="brochure-agenda">{agenda.length?agenda.slice(0,5).map(program=><article key={program.id}><span className="agenda-date">{program.date}</span><div><strong>{program.title}</strong><small>Agenda Masjid</small></div><i/></article>):<div className="brochure-empty"><MenuIcon index={7}/><h3>Belum ada agenda</h3><p>Kegiatan Masjid akan ditampilkan dari form Program &amp; Kegiatan.</p><a href="#kegiatan">Input Program &amp; Kegiatan →</a></div>}</div></section>}
 <section className="brochure-panel"><Heading icon={12} title="Aktivitas Input Terbaru"/>{records.length?<div className="brochure-notifications">{records.slice(0,5).map(row=><article key={row.id}><div><strong>{String(row.data.title||row.data.name||row.data.item||row.kind)}</strong><small>{row.kind} · {row.createdAt.slice(0,10)}</small></div></article>)}</div>:<div className="brochure-empty"><h3>Belum ada input</h3><p>Mulai dari formulir menu yang tersedia untuk paket Masjid Anda.</p></div>}</section>
 </div></>;
}
