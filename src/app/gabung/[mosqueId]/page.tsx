import {redirect} from 'next/navigation';
export default async function Join({params}:{params:Promise<{mosqueId:string}>}){const {mosqueId}=await params;redirect('/dashboard/masjid/'+mosqueId);}
