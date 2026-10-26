'use client';
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {PRAYER_CITIES,validTimeZone,prayerDate,type PrayerResult} from '@/lib/prayer-times';
import {useWorkspace} from './workspace-provider';
type Selection={city?:string;lat?:number;lon?:number};
type State={city:string;label:string;timeZone:string;userTimeZone:string;timings:Record<string,string>|null;status:string;locating:boolean;usingLocation:boolean;chooseCity:(city:string)=>void;locate:()=>void};
const Context=createContext<State|null>(null);
export function usePrayer(){const value=useContext(Context);if(!value)throw new Error('Prayer provider missing');return value;}
export default function PrayerProvider({children}:{children:ReactNode}){
 const {settings,records}=useWorkspace();
 const configuredCity=String(records.find(row=>row.kind==='shalat')?.data.city||settings.city||'');
 const [selection,setSelection]=useState<Selection>({}),[deviceZone,setDeviceZone]=useState('Asia/Jakarta'),[now,setNow]=useState<Date|null>(null);
 const [result,setResult]=useState<{key:string;value:PrayerResult}|null>(null),[status,setStatus]=useState('Pilih kota atau gunakan lokasi saya.'),[locationMessage,setLocationMessage]=useState(''),[locating,setLocating]=useState(false);
 const automatic=useRef(false),lastLocation=useRef(0),mounted=useRef(false),requestVersion=useRef(0);
 const key=JSON.stringify(selection);
 const timeZone=result?.key===key?result.value.timeZone:selection.city?PRAYER_CITIES[selection.city]:deviceZone;
 const day=now?prayerDate(now,timeZone):'';
 const locate=useCallback(()=>{
  if(!navigator.geolocation){setLocationMessage('Perangkat tidak mendukung lokasi. Silakan pilih kota.');return;}
  const version=++requestVersion.current;setLocating(true);setLocationMessage('Mendeteksi lokasi perangkat…');
  navigator.geolocation.getCurrentPosition(position=>{
   if(!mounted.current||version!==requestVersion.current)return;
   automatic.current=true;lastLocation.current=Date.now();setSelection({lat:Number(position.coords.latitude.toFixed(4)),lon:Number(position.coords.longitude.toFixed(4))});setLocationMessage(position.coords.accuracy>1000?'Lokasi masih berupa perkiraan perangkat. Pilih kota bila lokasi tidak sesuai.':'Menggunakan lokasi perangkat.');setLocating(false);
  },error=>{if(!mounted.current||version!==requestVersion.current)return;setLocating(false);setLocationMessage(error.code===1?'Izin lokasi belum diberikan. Silakan pilih kota atau aktifkan izin lokasi.':'Lokasi belum dapat dideteksi. Silakan coba lagi atau pilih kota.');},{enableHighAccuracy:true,timeout:12000,maximumAge:60000});
 },[]);
 useEffect(()=>{
  mounted.current=true;
  const refresh=()=>{const zone=Intl.DateTimeFormat().resolvedOptions().timeZone;if(validTimeZone(zone))setDeviceZone(zone);setNow(new Date());};refresh();
  try{const saved=localStorage.getItem('mdd-mosque-prayer-city');if(saved&&Object.hasOwn(PRAYER_CITIES,saved))setSelection({city:saved});else if(Object.hasOwn(PRAYER_CITIES,configuredCity))setSelection({city:configuredCity});}catch{if(Object.hasOwn(PRAYER_CITIES,configuredCity))setSelection({city:configuredCity});}
  if(navigator.permissions&&navigator.geolocation)navigator.permissions.query({name:'geolocation'}).then(permission=>{if(mounted.current&&permission.state==='granted')locate();}).catch(()=>{/* A location button is always available. */});
  const focus=()=>{refresh();if(automatic.current&&Date.now()-lastLocation.current>300000)locate();};
  const timer=setInterval(refresh,60000);window.addEventListener('focus',focus);
  return()=>{mounted.current=false;clearInterval(timer);window.removeEventListener('focus',focus);};
 // Configure the initial fallback once; visitor selections are not tenant settings.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[locate]);
 useEffect(()=>{
  if(!day||(!selection.city&&selection.lat===undefined))return;
  const controller=new AbortController();setStatus('Memuat jadwal…');
  const query=selection.city?'city='+encodeURIComponent(selection.city):'lat='+selection.lat+'&lon='+selection.lon+'&timezone='+encodeURIComponent(deviceZone);
  fetch('/api/prayer-times?'+query,{signal:controller.signal,cache:'no-store'}).then(async response=>{if(!response.ok)throw new Error();return response.json() as Promise<PrayerResult>;}).then(value=>{if(!controller.signal.aborted){setResult({key,value});setStatus('Sumber: AlAdhan · metode Kemenag (20). Sesuaikan dengan jadwal resmi Masjid setempat.');}}).catch(()=>{if(!controller.signal.aborted)setStatus('Jadwal belum tersedia. Coba kembali atau pilih kota.');});
  return()=>controller.abort();
 },[key,day,deviceZone,selection.city,selection.lat,selection.lon]);
 const chooseCity=(city:string)=>{if(city&&!Object.hasOwn(PRAYER_CITIES,city))return;automatic.current=false;requestVersion.current++;setLocating(false);setLocationMessage('');setSelection(city?{city}:{});setResult(null);setStatus(city?'Memuat jadwal…':'Pilih kota atau gunakan lokasi saya.');try{localStorage.setItem('mdd-mosque-prayer-city',city);}catch{/* Local preferences are optional. */}};
 const current=result?.key===key&&result.value.date===day?result.value.timings:null;
 return <Context.Provider value={{city:selection.city||'',label:selection.lat!==undefined?'Lokasi saya':selection.city||'Pilih lokasi',timeZone,userTimeZone:selection.lat!==undefined&&result?.key===key?result.value.timeZone:deviceZone,timings:current,status:locationMessage?locationMessage+' '+status:status,locating,usingLocation:selection.lat!==undefined,chooseCity,locate}}>{children}</Context.Provider>;
}
