import {jsPDF} from 'jspdf';
import {autoTable} from 'jspdf-autotable';
import {reportValue,rupiah,type MosqueReport} from './mosque-reports';
export function createReportPdf(report:MosqueReport,fontBase64:string){
 const doc=new jsPDF({unit:'mm',format:'a4',compress:true});
 doc.addFileToVFS('report-sans.ttf',fontBase64);doc.addFont('report-sans.ttf','ReportSans','normal');doc.addFont('report-sans.ttf','ReportSans','bold');
 const blue:[number,number,number]=[12,43,96],gold:[number,number,number]=[198,146,37];
 const width=210,margin=15;
 const clean=(s:string)=>s.replace(/[\u2010-\u2015]/g,'-');
 const time=new Intl.DateTimeFormat('id-ID',{dateStyle:'long',timeStyle:'short',timeZone:report.timezone}).format(new Date(report.generatedAt));
 doc.setProperties({title:'Laporan '+report.name,subject:`${report.from} sampai ${report.to}`,author:report.name,creator:'MASAJIDALLOH PRO'});
 const top=(first:boolean)=>{
 doc.setFillColor(...blue);doc.rect(0,0,width,first?51:25,'F');doc.setFillColor(...gold);doc.rect(0,first?51:25,width,1.3,'F');
 doc.setTextColor(255);doc.setFont('ReportSans','bold');doc.setFontSize(first?18:11);doc.text(clean('LAPORAN MASJID'),margin,first?14:10);
 doc.setFontSize(first?13:10);doc.text(doc.splitTextToSize(clean(report.name),180),margin,first?24:18);
 if(first){doc.setFont('ReportSans','normal');doc.setFontSize(9);doc.text(clean(`${report.from} s.d. ${report.to} | ${report.timezone}`),margin,40);doc.text(clean(report.publicOnly?'LAPORAN PUBLIK':report.preview?'DATA PRATINJAU - BUKAN DATA OPERASIONAL':'LAPORAN ADMIN MASJID'),margin,46);}
 };
 top(true);let y=61;
 doc.setTextColor(...blue);doc.setFontSize(9);doc.setFont('ReportSans','normal');
 const identity=doc.splitTextToSize(clean([report.city,report.address].filter(Boolean).join(' | ')||'Alamat belum diisi'),180);doc.text(identity,margin,y);y+=identity.length*4+5;
 doc.setFillColor(238,244,253);doc.roundedRect(margin,y,180,19,2,2,'F');doc.setFont('ReportSans','bold');doc.setFontSize(11);doc.text(`${report.count} catatan  |  ${report.sections.length} jenis laporan`,20,y+8);doc.setFont('ReportSans','normal');doc.setFontSize(8);doc.text(clean(`Diunduh: ${time} | Paket ${report.plan}`),20,y+14);y+=25;
 doc.setFontSize(8);const note=doc.splitTextToSize('Periode menggunakan tanggal transaksi; data tanpa tanggal transaksi menggunakan tanggal pencatatan di zona waktu Masjid. Data arsip tidak disertakan. Nilai non-uang tidak dijumlahkan sebagai kas. Total per menu tidak boleh dijumlahkan ulang sebagai saldo kas.',180);doc.text(note,margin,y);y+=note.length*3.8+7;
 for(const s of report.sections){
 if(y>240){doc.addPage();top(false);y=35;}
 doc.setFont('ReportSans','bold');doc.setFontSize(12);doc.setTextColor(...blue);doc.text(clean(s.title),margin,y);y+=7;
 doc.setFont('ReportSans','normal');doc.setFontSize(9);let summary=`${s.rows.length} catatan`;
 if(s.money)summary+=` | Masuk ${rupiah(s.incoming)} | Keluar ${rupiah(s.outgoing)}`;
 const lines=doc.splitTextToSize(clean(summary),180);doc.text(lines,margin,y);y+=lines.length*4+3;
 if(!s.rows.length){doc.setTextColor(100);doc.text('Belum ada data pada periode ini.',margin,y);y+=12;continue;}
 const body=s.rows.flatMap((r,i)=>[
 [String(i+1),'Referensi',clean(r.id)],
 [String(i+1),'Dicatat pada',clean(new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short',timeZone:report.timezone}).format(new Date(r.createdAt)))],
 ...s.fields.map(f=>[String(i+1),clean(f.label),clean(reportValue(r.data[f.key],f))])]);
 autoTable(doc,{startY:y,head:[['No','Kolom','Rincian '+clean(s.title)]],body,theme:'grid',margin:{top:34,bottom:18,left:margin,right:margin},styles:{font:'ReportSans',fontSize:9,cellPadding:2.6,overflow:'linebreak',textColor:[30,45,65],lineColor:[220,229,240],lineWidth:0.15},headStyles:{fillColor:blue,textColor:255,fontStyle:'bold'},columnStyles:{0:{cellWidth:10},1:{cellWidth:46},2:{cellWidth:124}},rowPageBreak:'avoid',showHead:'everyPage',didParseCell:data=>{if(data.section==='body'){const index=Number(data.row.raw instanceof Array?data.row.raw[0]:0);data.cell.styles.fillColor=index%2?[245,248,253]:[255,255,255];if(data.column.index===0)data.cell.styles.textColor=gold;}},willDrawPage:()=>{if(doc.getCurrentPageInfo().pageNumber>1)top(false);}});
 y=(doc as jsPDF&{lastAutoTable:{finalY:number}}).lastAutoTable.finalY+12;
 }
 const pages=doc.getNumberOfPages();for(let p=1;p<=pages;p++){doc.setPage(p);doc.setDrawColor(...gold);doc.line(15,283,195,283);doc.setFont('ReportSans','normal');doc.setFontSize(8);doc.setTextColor(...blue);doc.text('MASAJIDALLOH PRO | '+(report.publicOnly?'Publik':report.preview?'Pratinjau':'Admin'),15,289);doc.text(`Halaman ${p} dari ${pages}`,195,289,{align:'right'});}
 return doc;
}
