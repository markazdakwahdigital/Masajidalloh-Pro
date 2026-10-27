import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
import {tenantApplicationInput} from '../src/lib/tenant-registration.ts';
const source=async path=>fs.readFile(new URL('../'+path,import.meta.url),'utf8');
const valid={mosqueName:'Masjid Uji',city:'Jakarta',address:'Alamat lengkap Masjid uji',contactName:'Pengurus Uji',mosqueEmail:'uji@example.org',whatsapp:'081234567890',mosqueWhatsapp:'081234567891',plan:'ENTERPRISE'};
const form=()=>{const f=new FormData();Object.entries(valid).forEach(([k,v])=>f.set(k,v));return f;};
async function load(path,deps){let s=await source(path);s=s.replace(/^import .*;$/gm,'');s=ts.transpile(s,{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022});const exports={};new Function('exports',...Object.keys(deps),s)(exports,...Object.values(deps));return exports;}
test('draft survives verification, validates browser input and clears after submission',async()=>{
 const values=new Map();const jar={set:(k,v,o)=>values.set(k,{value:v,options:o}),get:k=>values.get(k),delete:k=>values.delete(k)};
 const draft=await load('src/lib/server/tenant-draft.ts',{cookies:async()=>jar,tenantApplicationInput});
 await draft.saveTenantDraft(valid);assert.deepEqual(await draft.readTenantDraft(),valid);
 for(const item of values.values()){assert.equal(item.options.httpOnly,true);assert.equal(item.options.sameSite,'lax');assert.equal(item.options.maxAge,3600);assert.ok(item.value.length<=3000);}
 jar.set('mp_tenant_draft_0','bad',{});assert.equal(await draft.readTenantDraft(),null);
 await draft.clearTenantDraft();assert.equal(values.size,0);
});
test('anonymous form submission saves only a draft; verified submission still checks authorization',async()=>{
 let user=null,saved=0,rpc=0,authorized=0,cleared=0;
 const action=await load('src/app/daftar-masjid/actions.ts',{redirect:p=>{throw new Error(p);},dataRpc:async()=>{rpc++;},createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user}})}}),saveTenantDraft:async()=>{saved++;},clearTenantDraft:async()=>{cleared++;},requireCurrentActor:async()=>{authorized++;},tenantApplicationInput});
 await assert.rejects(action.applyTenant(form()),/buat-akun\?next=daftar-masjid/);assert.equal(saved,1);assert.equal(rpc,0);assert.equal(authorized,0);
 user={email_confirmed_at:'2026-10-27'};await assert.rejects(action.applyTenant(form()),/status=received/);assert.equal(authorized,1);assert.equal(rpc,1);assert.equal(cleared,1);
});
