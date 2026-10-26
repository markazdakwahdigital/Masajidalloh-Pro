import test from 'node:test';
import assert from 'node:assert/strict';
import {validateModule,hasModule,summarize} from '../src/lib/mosque-workspace.ts';
test('donation destinations preserve leading zeros and cannot add cash to reports',()=>{
 const input={type:'Bank',provider:'BSI',number:'001234567890',holder:'Masjid Uji',purpose:'Donasi'};
 const saved=validateModule('rekening',input);assert.equal(saved.data.number,'001234567890');
 for(const plan of ['BASIC','PRO','ENTERPRISE'])assert.ok(hasModule(plan,'rekening'));
 assert.equal(summarize([{id:'account',kind:'rekening',data:saved.data,createdAt:'2026-10-26'}],'BASIC','2026-10-26').balance,0);
 for(const number of ['javascript:alert(1)','123','123456x','9'.repeat(41)])assert.ok(validateModule('rekening',{...input,number}).error);
 assert.ok(validateModule('rekening',{...input,type:'Unknown'}).error);
});
test('infaq accepts Takmir Masjid and Aplikasi while rejecting unknown sources',()=>{
 const input={receipt:'Infaq',form:'Uang',date:'2026-10-26',amount:'1000'};
 for(const source of ['Takmir Masjid','Aplikasi'])assert.equal(validateModule('infaq',{...input,source}).data.source,source);
 assert.ok(validateModule('infaq',{...input,source:'Unknown'}).error);
});
