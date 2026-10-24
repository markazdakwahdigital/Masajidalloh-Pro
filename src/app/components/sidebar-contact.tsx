'use client';
import { useWorkspace } from './workspace-provider';
import { safeWebsite } from '@/lib/mosque-workspace';
export default function SidebarContact(){
 const {settings}=useWorkspace();
 const website=safeWebsite(settings.website||'');
 const phone=(settings.servicePhone||'').replace(/[^+\d]/g,'');
 return <div className="side-foot sidebar-contact">
  {website?<a href={website} target="_blank" rel="noopener noreferrer">{website.replace(/^https?:\/\//,'').replace(/\/$/,'')}</a>:<span>Alamat Website Masjid belum diisi</span>}
  <p>Untuk Informasi &amp; Pengaduan hubungi :</p>
  {phone?<a href={'tel:'+phone}>{settings.servicePhone}</a>:<span>Nomor layanan Masjid belum diisi</span>}
 </div>;
}
