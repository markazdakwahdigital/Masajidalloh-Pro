import test from 'node:test';
import assert from 'node:assert/strict';
import {selectChair,chairPhotoUrl} from '../src/lib/chair-profile.ts';
const row=(id,position,active,startDate='2026-01-01')=>({id,kind:'dkm',data:{name:id,position,active,startDate},createdAt:'2026-01-01T00:00:00Z'});
test('header chooses the latest active Ketua DKM and ignores other roles',()=>{
 const rows=[row('old','Ketua DKM',true),row('inactive','Ketua DKM',false,'2027-01-01'),row('secretary','Sekretaris DKM',true),row('current','Ketua DKM',true,'2026-10-01')];
 assert.equal(selectChair(rows).id,'current');assert.equal(selectChair([]),undefined);assert.equal(selectChair([row('inactive','Ketua DKM',false)]),undefined);
});
test('photo URL is same-origin and missing or malformed IDs fall back',()=>{
 assert.equal(chairPhotoUrl('mosque','abc'),undefined);assert.equal(chairPhotoUrl('mosque',undefined),undefined);assert.equal(chairPhotoUrl('mosque','https://example.com/x'),undefined);assert.equal(chairPhotoUrl('mosque','a_valid_drive_photo_id'),'/api/masjid/mosque/foto-ketua?v=a_valid_drive_photo_id');
});
