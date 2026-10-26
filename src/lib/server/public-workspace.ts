import 'server-only';
import {publicDataClient} from './public-data';
import type {PackagePlan,ModuleRecord,WorkspaceSettings} from '@/lib/mosque-workspace';
export type TenantWorkspace={id:string;name:string;plan:PackagePlan;canWrite:boolean;settings:WorkspaceSettings;records:ModuleRecord[]};
export async function publicWorkspace(id:string):Promise<TenantWorkspace>{
 const client=publicDataClient();const {data,error}=await client.rpc('mp_public_workspace',{p_mosque:id});
 if(error||!data)throw new Error('tenant_unavailable');return data as TenantWorkspace;
}
