import type {ModuleRecord} from './mosque-workspace';
export function selectChair(records:ModuleRecord[]){
 return records.filter(r=>r.kind==='dkm'&&r.data.position==='Ketua DKM'&&r.data.active===true&&String(r.data.name||'').trim()).sort((a,b)=>String(b.data.startDate||'').localeCompare(String(a.data.startDate||''))||b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id))[0];
}
export function chairPhotoUrl(mosqueId:string,photoId:unknown){
 return typeof photoId==='string'&&/^[-\w]{10,200}$/.test(photoId)?'/api/masjid/'+encodeURIComponent(mosqueId)+'/foto-ketua?v='+encodeURIComponent(photoId):undefined;
}
