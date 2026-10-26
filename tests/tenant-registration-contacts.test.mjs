import test from 'node:test';
import assert from 'node:assert/strict';
import {tenantApplicationInput} from '../src/lib/tenant-registration.ts';
const valid={mosqueName:'Masjid Contoh',city:'Jakarta',address:'Alamat Masjid Contoh',contactName:'Pengurus Contoh',mosqueEmail:' KONTAK@Example.org ',whatsapp:'081234567890',mosqueWhatsapp:'+62 8123456789',plan:'BASIC'};
const parse=input=>{const form=new FormData();for(const [key,value] of Object.entries(input))form.set(key,value);return tenantApplicationInput(form);};
test('registration keeps Mosque contacts distinct and never accepts an applicant account override',()=>{
 const data=parse({...valid,email:'another-account@example.org',userId:'another-user'});
 assert.equal(data.mosqueEmail,'kontak@example.org');assert.equal(data.whatsapp,'081234567890');assert.equal(data.mosqueWhatsapp,'+62 8123456789');assert.equal(data.email,undefined);assert.equal(data.userId,undefined);
});
test('both contacts are required and malformed input is rejected before submission',()=>{
 for(const patch of [{mosqueEmail:''},{mosqueEmail:'a@b@c.org'},{mosqueEmail:'not an email'},{mosqueWhatsapp:''},{whatsapp:''},{mosqueWhatsapp:'---------'},{mosqueWhatsapp:'0'.repeat(16)},{plan:'OWNER'}])assert.equal(parse({...valid,...patch}),null);
});
