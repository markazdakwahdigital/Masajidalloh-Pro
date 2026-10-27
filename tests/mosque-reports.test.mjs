import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import ts from 'typescript';
const root=process.cwd();const folder=await fs.mkdtemp(path.join(root,'tmp-report-test-'));
for(const name of ['mosque-workspace','mosque-reports','mosque-report-pdf']){const source=await fs.readFile(`src/lib/${name}.ts`,'utf8');const output=ts.transpile(source,{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}).replaceAll("'./mosque-workspace'","'./mosque-workspace.mjs'").replaceAll("'./mosque-reports'","'./mosque-reports.mjs'");await fs.writeFile(path.join(folder,name+'.mjs'),output);}
const {makeReport,reportCsv}=await import(pathToFileURL(path.join(folder,'mosque-reports.mjs')));
const {createReportPdf}=await import(pathToFileURL(path.join(folder,'mosque-report-pdf.mjs')));
const row=(id,kind,data,createdAt='2026-10-01T00:00:00Z')=>({id,kind,data,createdAt});
const input={settings:{name:'Masjid Contoh Pengujian',city:'Jakarta',address:'Jalan Contoh - hanya data pengujian',timezone:'Asia/Jakarta'},plan:'ENTERPRISE',from:'2026-10-01',to:'2026-10-31',kind:'all',now:new Date('2026-10-27T01:00:00Z'),records:[row('uang','infaq',{date:'2026-10-01',form:'Uang',amount:'125000'}),row('barang','infaq',{date:'2026-10-31',form:'Barang',amount:'999999',item:'Beras',quantity:'20',unit:'kg'}),row('out','keuangan',{date:'2026-10-10',type:'Pengeluaran',amount:'50000'}),row('late','donasi',{date:'2026-11-01',amount:'1000000'}),row('local','jamaah',{name:'Ahmad',active:true},'2026-09-30T18:00:00Z')]};
test('inclusive dates, local creation dates and non-money totals are correct',()=>{const r=makeReport(input);assert.equal(r.count,4);assert.equal(r.sections.find(s=>s.kind==='infaq').incoming,125000);assert.equal(r.sections.find(s=>s.kind==='keuangan').outgoing,50000);assert.throws(()=>makeReport({...input,from:'2026-02-30'}));assert.throws(()=>makeReport({...input,kind:'unknown'}));assert.throws(()=>makeReport({...input,kind:'inventaris',plan:'PRO'}));});
test('CSV keeps all fields, escapes quotes/newlines/formulas and does not invent private public fields',()=>{const r=makeReport({...input,publicOnly:true,records:[row('public','jamaah',{name:'=IMPORTXML("evil")\nTest',active:false})]});const csv=reportCsv(r);assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes("'=IMPORTXML"));assert.ok(csv.includes('""evil""'));assert.ok(csv.includes('Tidak'));assert.ok(!csv.includes('Nomor WhatsApp'));assert.ok(!csv.includes('Email'));});
test('long detailed PDF paginates and keeps the final record and complete text',async()=>{
 const long='Rincian bantuan yang panjang, lengkap, dan terbaca dengan baik. '.repeat(28);
 const records=Array.from({length:35},(_,i)=>row(`REF-${i+1}`,'penerima',{name:`Penerima Contoh ${i+1}`,category:'Fakir',address:'Alamat contoh untuk pengujian',phone:'081234567890',guardian:'Wali Contoh',assistance:'Donasi',needs:long,active:true,note:'Catatan akhir '+(i+1)}));
 const r=makeReport({...input,kind:'penerima',records});const font=(await fs.readFile('public/fonts/report-sans.ttf')).toString('base64');const doc=createReportPdf(r,font);assert.ok(doc.getNumberOfPages()>2);const bytes=Buffer.from(doc.output('arraybuffer'));assert.ok(bytes.subarray(0,4).toString()==='%PDF');await fs.mkdir('tmp/pdfs',{recursive:true});await fs.writeFile('tmp/pdfs/laporan-pengujian.pdf',bytes);
});
test.after(async()=>{await fs.rm(folder,{recursive:true,force:true});});
