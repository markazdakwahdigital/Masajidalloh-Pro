import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHmac,randomUUID} from 'node:crypto';
import vm from 'node:vm';
const code=readFileSync(new URL('../integrations/dkm-drive.gs',import.meta.url),'utf8');
function request({wrongParent=false,wrongName=false,trashed=false,signatureInvalid=false}={}){
 const mosqueId=randomUUID(),recordId=randomUUID(),nonce=randomUUID(),key='test-key',bytes=[137,80,78,71,13,10,26,10];
 const folder={getId:()=> 'tenant-folder'};
 const file={getParents:()=>{let done=false;return {hasNext:()=>!done,next:()=>{done=true;return {getId:()=>wrongParent?'another-folder':'tenant-folder'};}};},getName:()=> (wrongName?randomUUID():recordId)+'-'+nonce+'.png',isTrashed:()=>trashed,getSize:()=>bytes.length,getMimeType:()=> 'image/png',getBlob:()=>({getBytes:()=>bytes})};
 const lock={tryLock:()=>true,hasLock:()=>true,releaseLock:()=>{}};
 const ctx={Session:{getEffectiveUser:()=>({getEmail:()=> 'markazdakwahdigital.01@gmail.com'})},PropertiesService:{getScriptProperties:()=>({getProperty:n=>n==='DKM_DRIVE_SIGNING_KEY'?key:'root'})},LockService:{getScriptLock:()=>lock},CacheService:{getScriptCache:()=>({get:()=>null,put:()=>{}})},DriveApp:{getFolderById:()=>({getName:()=> 'Foto DKM Masjidalloh',getOwner:()=>({getEmail:()=> 'markazdakwahdigital.01@gmail.com'}),getFoldersByName:name=>({hasNext:()=>name===mosqueId,next:()=>folder})}),getFileById:()=>file},Utilities:{computeHmacSha256Signature:(p,k)=>[...createHmac('sha256',k).update(p).digest()],base64Encode:b=>Buffer.from(b).toString('base64')},ContentService:{MimeType:{JSON:'json'},createTextOutput:body=>({setMimeType:()=>body})}};
 vm.createContext(ctx);vm.runInContext(code,ctx);
 const payload=JSON.stringify({operation:'read',mosqueId,recordId,nonce,timestamp:Date.now(),fileId:'a_valid_drive_photo_id'}),signature=signatureInvalid?'bad':createHmac('sha256',key).update(payload).digest('hex');
 return JSON.parse(ctx.doPost({postData:{contents:JSON.stringify({payload,signature})}}));
}
test('signed photo reads return bytes for the matching record and tenant folder',()=>{const r=request();assert.equal(r.ok,true);assert.equal(r.mimeType,'image/png');assert.ok(r.base64);});
test('Drive photo reads reject another folder, another record, trashed files and unsigned calls',()=>{for(const x of [{wrongParent:true},{wrongName:true},{trashed:true},{signatureInvalid:true}])assert.equal(request(x).ok,false);});
