'use client';
type Admin={mosqueName:string;name:string;email:string;primary:boolean;tenantStatus:string;since:string};
export default function ExportAdmins({admins}:{admins:Admin[]}){
 function download(){
  const cell=(value:unknown)=>'"'+String(value??'').replace(/^[\s]*[=+\-@]|^[\t\r]/,"'$&").replaceAll('"','""')+'"';
  const rows=[['Nama Masjid','Nama Admin','Email Login','Peran','Status Tenant','Sejak'],...admins.map(a=>[a.mosqueName,a.name,a.email,a.primary?'Admin Utama':'Admin Tambahan',a.tenantStatus,a.since])];
  const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='Daftar-Admin-Tenant-Masajidalloh-Pro.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 return <button className="plan-button" type="button" onClick={download}>Unduh Daftar Admin CSV</button>;
}
