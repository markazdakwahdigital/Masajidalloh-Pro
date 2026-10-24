import test from 'node:test';
import assert from 'node:assert/strict';
import {validateModule,summarize,hasModule,safeWebsite} from '../src/lib/mosque-workspace.ts';
const row=(kind,data)=>({id:kind+JSON.stringify(data),kind,data,createdAt:'2026-10-24T00:00:00Z'});
test('dashboard uses entered money, excludes non-cash Infaq, and filters package access',()=>{
 const rows=[row('donasi',{amount:'100000',date:'2026-10-24'}),row('infaq',{form:'Barang',amount:'999999',date:'2026-10-24'}),row('infaq',{form:'Uang',amount:'50000',date:'2026-10-24'}),row('keuangan',{type:'Pengeluaran',amount:'20000',date:'2026-10-24'}),row('keuangan',{type:'Pengeluaran',amount:'10000',date:'2026-10-23'})];
 const summary=summarize(rows,'ENTERPRISE','2026-10-24');assert.equal(summary.balance,120000);assert.equal(summary.expensesToday,20000);assert.equal(summary.donationsToday,100000);
 assert.equal(summarize(rows,'BASIC','2026-10-24').income.length,0);assert.equal(hasModule('PRO','umkm'),false);assert.equal(hasModule('ENTERPRISE','umkm'),true);
});
test('Infaq requires item quantity for non-cash, supports Lainnya and drops its cash value',()=>{
 const common={receipt:'Infaq',date:'2026-10-24',source:'Lainnya'};
 assert.ok(validateModule('infaq',{...common,form:'Barang'}).error);
 const result=validateModule('infaq',{...common,form:'Makanan',item:'Nasi box',quantity:'10',unit:'Kotak',amount:'900000'});assert.equal(result.data.amount,'');
 assert.ok(validateModule('infaq',{...common,form:'Uang',amount:'0'}).error);
 assert.equal(validateModule('infaq',{...common,form:'Uang',amount:'10000'}).data.amount,'10000');
});
test('website rejects script URLs and keeps safe new-tab destinations',()=>{
 assert.equal(safeWebsite('javascript:alert(1)'),null);assert.equal(safeWebsite('https://user:password@example.com'),null);assert.equal(safeWebsite('Masjid.example.org'),'https://masjid.example.org/');
 assert.ok(validateModule('setting',{name:'Masjid Uji',timezone:'Asia/Jakarta',website:'javascript:alert(1)'}).error);
});
test('server validation ignores submitted plan and unknown fields',()=>{
 const result=validateModule('setting',{name:'Masjid Uji',timezone:'Asia/Jakarta',website:'https://example.org',plan:'ENTERPRISE',servicePhone:'081234567890'});
 assert.equal(result.data.plan,undefined);assert.equal(result.data.servicePhone,'081234567890');
});
