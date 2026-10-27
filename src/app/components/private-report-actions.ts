'use server';
import {dataRpc} from '@/lib/server/data-api';
import type {TenantWorkspace} from '@/lib/server/public-workspace';
export async function loadPrivateReport(mosqueId:string):Promise<TenantWorkspace>{
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mosqueId))throw new Error('Masjid tidak valid.');
 try{return await dataRpc<TenantWorkspace>('mp_report_workspace',{p_mosque:mosqueId});}
 catch{throw new Error('Unduh laporan hanya tersedia untuk Admin Masjid terkait atau Admin platform yang sudah login.');}
}
