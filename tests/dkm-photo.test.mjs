import test from 'node:test';
import assert from 'node:assert/strict';
import {checkDkmPhoto,DKM_PHOTO_MAX_BYTES} from '../src/lib/dkm-photo.ts';
import {validateModule,DKM_ROLES,hasModule,MODULE_FIELDS} from '../src/lib/mosque-workspace.ts';
test('DKM photo enforces 2 MB and verifies image signatures',()=>{
 const jpg=new Uint8Array([255,216,255,224]);
 assert.equal(checkDkmPhoto(DKM_PHOTO_MAX_BYTES,'image/jpeg',jpg),null);
 assert.ok(checkDkmPhoto(DKM_PHOTO_MAX_BYTES+1,'image/jpeg',jpg));
 assert.ok(checkDkmPhoto(0,'image/jpeg',jpg));
 assert.ok(checkDkmPhoto(100,'image/svg+xml',jpg));
 assert.ok(checkDkmPhoto(100,'image/png',jpg));
 assert.equal(checkDkmPhoto(100,'image/png',new Uint8Array([137,80,78,71,13,10,26,10])),null);
 assert.equal(checkDkmPhoto(100,'image/webp',new TextEncoder().encode('RIFF1234WEBP')),null);
});
test('separate DKM biodata supports every role without accepting photo IDs from clients',()=>{
 const base={name:'Pengurus Uji',gender:'Laki-laki',address:'Alamat uji',phone:'081234567890',startDate:'2026-10-24'};
 assert.equal(DKM_ROLES.length,16);
 for(const position of DKM_ROLES)assert.equal(validateModule('dkm',{...base,position}).data.position,position);
 assert.ok(validateModule('dkm',{...base,position:'Tidak dikenal'}).error);
 assert.ok(validateModule('dkm',{...base,position:'Ketua DKM',birthDate:'2999-01-01'}).error);
 assert.ok(validateModule('dkm',{...base,position:'Ketua DKM',endDate:'2020-01-01'}).error);
 assert.equal(validateModule('dkm',{...base,position:'Ketua DKM',photoId:'injected-drive-file'}).data.photoId,undefined);
 assert.equal(hasModule('BASIC','dkm'),true);
 assert.equal(MODULE_FIELDS.profil.some(field=>field.key==='chair'),false);
});
