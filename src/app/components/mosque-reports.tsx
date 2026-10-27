'use client';
import {useState} from 'react';
import {useWorkspace} from './workspace-provider';
import {hasModule,dateKey} from '@/lib/mosque-workspace';
import {REPORT_KINDS,makeReport,reportCsv,reportFilename} from '@/lib/mosque-reports';
export default function MosqueReports(){
 const {records,settings,plan,preview,canWrite}=useWorkspace();
 const today=dateKey(new Date(),settings.timezone||'Asia/Jakarta');
 const [from,setFrom]=useState(today.slice(0,7)+'-01'),[to,setTo]=useState(today),[kind,setKind]=useState('all'),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function download(format:'pdf'|'csv'){
  setBusy(true);setMessage('');
  try{
   const report=makeReport({records,settings,plan,from,to,kind,preview,publicOnly:!canWrite});
   if(!report.count){setMessage('Belum ada data sesuai jenis laporan dan periode ini.');return;}
   let blob:Blob;
   if(format==='pdf'){const {createReportPdf}=await import('@/lib/mosque-report-pdf');const response=await fetch('/fonts/report-sans.ttf');if(!response.ok)throw new Error('Font laporan belum tersedia. Silakan coba lagi.');const bytes=new Uint8Array(await response.arrayBuffer());let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);blob=createReportPdf(report,btoa(binary)).output('blob');}
   else blob=new Blob([reportCsv(report)],{type:'text/csv;charset=utf-8'});
   const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=reportFilename(report,format);document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
   setMessage(`Laporan ${format.toUpperCase()} berhasil disiapkan: ${report.count} catatan.`);
  }catch(error){setMessage(error instanceof Error?error.message:'Laporan belum dapat diunduh. Silakan coba lagi.');}
  finally{setBusy(false);}
 }
 return <section aria-label="Unduh laporan Masjid"><p className="brochure-note">Pilih jenis laporan dan periode. PDF berwarna memuat ringkasan dan rincian lengkap. CSV berisi data terstruktur untuk spreadsheet; warna dan tata letak tidak didukung oleh format CSV.</p><form className="brochure-form module-form" onSubmit={event=>{event.preventDefault();void download('pdf');}}>
 <label>Jenis Laporan<select value={kind} onChange={e=>setKind(e.target.value)}><option value="all">Semua Menu</option>{Object.entries(REPORT_KINDS).filter(([k])=>hasModule(plan,k)).map(([k,label])=><option key={k} value={k}>{label}</option>)}</select></label>
 <label>Tanggal Awal<input type="date" value={from} onChange={e=>setFrom(e.target.value)} required/></label><label>Tanggal Akhir<input type="date" value={to} onChange={e=>setTo(e.target.value)} required min={from}/></label>
 <div className="module-actions span-two"><button type="submit" disabled={busy}>{busy?'Menyiapkan laporan…':'Unduh Laporan PDF'}</button><button type="button" disabled={busy} onClick={()=>void download('csv')}>Unduh Laporan CSV</button></div>
 <p className="brochure-note span-two">Data tanpa tanggal transaksi disaring berdasarkan tanggal pencatatan. {canWrite?'Ekspor Admin dapat memuat biodata pribadi; bagikan sesuai kebutuhan Masjid.':'Ekspor hanya memuat data laporan publik.'}</p>{message&&<p className="span-two brochure-note" role="status">{message}</p>}
 </form></section>;
}
