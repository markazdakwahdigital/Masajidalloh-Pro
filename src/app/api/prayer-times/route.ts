import {NextResponse} from 'next/server';
import {prayerLocation,loadPrayerTimes,type PrayerLocation} from '@/lib/prayer-times';
export async function GET(request:Request){
 let location:PrayerLocation;try{location=prayerLocation(new URL(request.url).searchParams);}catch{return NextResponse.json({error:'Pilih kota atau koordinat lokasi yang valid.'},{status:400});}
 try{return NextResponse.json(await loadPrayerTimes(location),{headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});}
 catch{return NextResponse.json({error:'Jadwal sementara tidak tersedia. Silakan coba lagi.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
