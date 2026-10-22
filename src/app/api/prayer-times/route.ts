import { NextResponse } from 'next/server';
const CITIES: Record<string,string> = {Bogor:'Asia/Jakarta',Jakarta:'Asia/Jakarta',Bandung:'Asia/Jakarta',Semarang:'Asia/Jakarta',Yogyakarta:'Asia/Jakarta',Surabaya:'Asia/Jakarta',Medan:'Asia/Jakarta',Makassar:'Asia/Makassar',Denpasar:'Asia/Makassar',Balikpapan:'Asia/Makassar',Jayapura:'Asia/Jayapura'};
const KEYS=['Fajr','Dhuhr','Asr','Maghrib','Isha'];
export async function GET(request:Request){
 const city=new URL(request.url).searchParams.get('city')||'';
 if(!Object.hasOwn(CITIES,city)) return NextResponse.json({error:'Pilih kota yang didukung'},{status:400});
 const timezone=CITIES[city];
 const d=new Date();
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:timezone,day:'2-digit',month:'2-digit',year:'numeric'}).formatToParts(d);
 const get=(k:string)=>parts.find(p=>p.type===k)?.value;
 const date=[get('day'),get('month'),get('year')].join('-');
 const endpoint='https://api.aladhan.com/v1/timingsByCity/'+date+'?city='+encodeURIComponent(city)+'&country=Indonesia&method=20';
 try {
  const response=await fetch(endpoint,{next:{revalidate:900},signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw new Error('external error');
  const json=await response.json() as {code?:number;data?:{timings?:Record<string,string>;meta?:{timezone?:string}}};
  if(json.code!==200||!json.data?.timings)throw new Error('invalid API');
  const timings:Record<string,string>={};
  for(const key of KEYS){
   const value=json.data.timings[key];
   if(!value||!/^\d{1,2}:\d{2}/.test(value))throw new Error('Invalid time');
   timings[key]=value.slice(0,5);
  }
  return NextResponse.json({city,date,timeZone:timezone,method:'Kemenag 20',timings},{headers:{'Cache-Control':'public, max-age=300, s-maxage=900'}});
 }catch{return NextResponse.json({error:'Jadwal sementara tidak tersedia'},{status:503});}
}
