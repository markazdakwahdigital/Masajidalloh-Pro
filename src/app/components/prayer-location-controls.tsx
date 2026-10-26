'use client';
import {PRAYER_CITIES,zoneLabel} from '@/lib/prayer-times';
import {usePrayer} from './prayer-provider';
export default function PrayerLocationControls({id}:{id:string}){
 const prayer=usePrayer();
 return <div className="prayer-location-controls"><p>Zona waktu{prayer.city?' jadwal':' otomatis'}: <strong>{zoneLabel(prayer.timeZone)}</strong> · {prayer.timeZone}</p><button type="button" onClick={prayer.locate} disabled={prayer.locating}>{prayer.locating?'Mendeteksi lokasi…':prayer.usingLocation?'Perbarui lokasi saya':'Gunakan lokasi saya'}</button><small>Dengan izin Anda, lokasi dipakai untuk menghitung jadwal melalui AlAdhan.</small><label htmlFor={id}>Atau pilih kota</label><select id={id} value={prayer.city} onChange={event=>prayer.chooseCity(event.target.value)}><option value="">Pilih kota…</option>{Object.keys(PRAYER_CITIES).map(city=><option key={city}>{city}</option>)}</select></div>;
}
