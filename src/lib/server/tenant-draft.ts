import 'server-only';
import {cookies} from 'next/headers';
import {tenantApplicationInput} from '@/lib/tenant-registration';
const names=['mp_tenant_draft_0','mp_tenant_draft_1','mp_tenant_draft_2'];
export async function saveTenantDraft(input:NonNullable<ReturnType<typeof tenantApplicationInput>>){
 const jar=await cookies();const encoded=Buffer.from(JSON.stringify(input)).toString('base64url');
 if(encoded.length>9000)throw new Error('draft_too_large');
 names.forEach((name,i)=>jar.set(name,encoded.slice(i*3000,(i+1)*3000),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:3600}));
}
export async function readTenantDraft(){
 try{const jar=await cookies();const raw=names.map(name=>jar.get(name)?.value??'').join('');if(!raw||raw.length>9000)return null;
 const data=JSON.parse(Buffer.from(raw,'base64url').toString('utf8'));const form=new FormData();
 for(const [key,value] of Object.entries(data))if(typeof value==='string')form.set(key,value);
 return tenantApplicationInput(form);
 }catch{return null;}
}
export async function clearTenantDraft(){const jar=await cookies();names.forEach(name=>jar.delete(name));}
