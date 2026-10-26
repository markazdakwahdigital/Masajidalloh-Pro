import test from 'node:test';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
import jsQR from 'jsqr';
import {publicMosquePath,publicMosqueUrl,mosqueManifest,PUBLIC_APP_ORIGIN} from '../src/lib/tenant-public-app.ts';
import {renderMosqueQr} from '../src/lib/mosque-qr-image.ts';
const first='00000000-0000-4000-8000-000000000001',second='00000000-0000-4000-8000-000000000002';
test('each QR decodes to the canonical public dashboard of its own tenant',async()=>{
 for(const id of [first,second]){
  const png=PNG.sync.read(await renderMosqueQr(publicMosqueUrl(id)));
  const decoded=jsQR(new Uint8ClampedArray(png.data),png.width,png.height);
  assert.ok(decoded,'PNG must be readable by an independent QR decoder');
  assert.equal(decoded.data,PUBLIC_APP_ORIGIN+'/dashboard/masjid/'+id);
  const url=new URL(decoded.data);assert.equal(url.search,'');assert.equal(url.hash,'');
 }
});
test('installed tenant apps have distinct identities and open the selected public dashboard',()=>{
 const a=mosqueManifest(first,'Masjid Pertama'),b=mosqueManifest(second,'Masjid Kedua');
 assert.notEqual(a.id,b.id);assert.equal(a.id,publicMosquePath(first));assert.equal(a.start_url,a.id);assert.ok(a.start_url.startsWith(a.scope));assert.equal(a.name,'Masjid Pertama');assert.equal(b.start_url,publicMosquePath(second));
 for(const bad of ['https://malicious.invalid/','../login',first+'?token=secret',first+'#x','not-a-tenant'])assert.throws(()=>publicMosqueUrl(bad));
});
