import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('pricing uses requested monthly plans and keeps activation under review',()=>{
 const src=read('src/lib/tenant-plans.ts');
 for(const value of ['99K','199K','249K','Professional','Hak Akses (Admin Masjid & Jamaah)'])assert.ok(src.includes(value));
 assert.match(read('src/app/paket/page.tsx'),/Tidak ada checkout atau penagihan otomatis/);
 const marketing=read('docs/index.html');
 assert.match(marketing,/\/login" target="_blank" rel="noopener noreferrer" class="btn dark">Login Pengurus/);
 assert.match(marketing,/class="register-cta"/);
 assert.doesNotMatch(marketing,/Buka Aplikasi MASAJIDALLOH PRO/);
});
test('registration only inserts PENDING tenant applications with rate limit',()=>{
 const src=read('src/app/daftar-masjid/actions.ts');
 assert.match(src,/tenantApplication\.create/);
 assert.match(src,/status:'PENDING'/);
 assert.match(src,/recent>=2/);
 assert.match(src,/value\(f,'website'\)/);
 assert.doesNotMatch(src,/auth\.signUp\(/);
 assert.doesNotMatch(src,/mosque\.create\(/);
});
test('landing and login provide entry to packages and registration',()=>{
 assert.match(read('src/app/page.tsx'),/href="\/paket"/);
 assert.match(read('src/app/login/page.tsx'),/href="\/paket"/);
});
