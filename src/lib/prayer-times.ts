export const PRAYER_CITIES:Record<string,string>={Bogor:'Asia/Jakarta',Jakarta:'Asia/Jakarta',Bandung:'Asia/Jakarta',Semarang:'Asia/Jakarta',Yogyakarta:'Asia/Jakarta',Surabaya:'Asia/Jakarta',Medan:'Asia/Jakarta',Makassar:'Asia/Makassar',Denpasar:'Asia/Makassar',Balikpapan:'Asia/Makassar',Jayapura:'Asia/Jayapura'};
export const PRAYER_NAMES=[['Subuh','Fajr'],['Dzuhur','Dhuhr'],['Ashar','Asr'],['Maghrib','Maghrib'],['Isya','Isha']];
export function validTimeZone(zone:unknown):zone is string{if(typeof zone!=='string'||zone.length>100)return false;try{new Intl.DateTimeFormat('id-ID',{timeZone:zone}).format();return true;}catch{return false;}}
export function zoneLabel(zone:string){return ({'Asia/Jakarta':'WIB','Asia/Pontianak':'WIB','Asia/Makassar':'WITA','Asia/Jayapura':'WIT'} as Record<string,string>)[zone]||zone.replaceAll('_',' ');}
export function prayerDate(now:Date,zone:string){const parts=new Intl.DateTimeFormat('en-GB',{timeZone:zone,day:'2-digit',month:'2-digit',year:'numeric'}).formatToParts(now);const get=(type:string)=>parts.find(p=>p.type===type)!.value;return [get('day'),get('month'),get('year')].join('-');}
export function prayerLocation(params:URLSearchParams){
 if(params.has('lat')||params.has('lon')){
  const la=params.get('lat')?.trim(),lo=params.get('lon')?.trim();const lat=Number(la),lon=Number(lo);
  if(!la||!lo||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)throw new Error('invalid_coordinates');
  return {lat:Number(lat.toFixed(4)),lon:Number(lon.toFixed(4)),zone:validTimeZone(params.get('timezone'))?params.get('timezone')!:'UTC'};
 }
 const city=params.get('city')||'';if(!Object.hasOwn(PRAYER_CITIES,city))throw new Error('invalid_city');return {city,zone:PRAYER_CITIES[city]};
}
export type PrayerLocation=ReturnType<typeof prayerLocation>;
export type PrayerResult={date:string;timeZone:string;timings:Record<string,string>;method:string;city:string};
export async function loadPrayerTimes(location:PrayerLocation,now=new Date(),fetcher:typeof fetch=fetch):Promise<PrayerResult>{
 const load=async(date:string)=>{
  const query='method=20&'+('city' in location?'city='+encodeURIComponent(location.city!)+'&country=Indonesia':'latitude='+location.lat+'&longitude='+location.lon);
  const response=await fetcher('https://api.aladhan.com/v1/'+('city' in location?'timingsByCity/':'timings/')+date+'?'+query,{signal:AbortSignal.timeout(8000),cache:'no-store'});
  if(!response.ok)throw new Error('prayer_unavailable');const json=await response.json();
  if(json.code!==200||!json.data?.timings||!validTimeZone(json.data?.meta?.timezone))throw new Error('invalid_prayer_response');return json.data;
 };
 let date=prayerDate(now,location.zone),data=await load(date);const localDate=prayerDate(now,data.meta.timezone);
 if(date!==localDate){date=localDate;data=await load(date);}
 const timings:Record<string,string>={};
 for(const [,key] of PRAYER_NAMES){const value=data.timings[key];if(typeof value!=='string'||!/^([01]\d|2[0-3]):[0-5]\d(?:\s|$)/.test(value))throw new Error('invalid_prayer_time');timings[key]=value.slice(0,5);}
 return {date,timeZone:data.meta.timezone,timings,method:'Kemenag 20',city:'city' in location?location.city!:'Lokasi saya'};
}
