import {redirect} from 'next/navigation';
export default async function Access({params}:{params:Promise<{mosqueId:string}>}){const {mosqueId}=await params;redirect('/dashboard/masjid/'+mosqueId+'/admin');}
