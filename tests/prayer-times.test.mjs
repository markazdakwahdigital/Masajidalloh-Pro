import test from 'node:test';
import assert from 'node:assert/strict';
import {prayerLocation,prayerDate,loadPrayerTimes,zoneLabel} from '../src/lib/prayer-times.ts';
const times={Fajr:'04:20',Dhuhr:'12:01',Asr:'15:10',Maghrib:'18:02',Isha:'19:15'};
test('coordinates preserve zero, reject missing/nonfinite/out-of-range data, and limit precision',()=>{
 assert.deepEqual(prayerLocation(new URLSearchParams('lat=0&lon=0&timezone=UTC')),{lat:0,lon:0,zone:'UTC'});
 assert.equal(prayerLocation(new URLSearchParams('lat=-6.2000001&lon=106.8000001')).lat,-6.2);
 for(const q of ['lat=&lon=1','lat=1','lat=NaN&lon=1','lat=91&lon=1','lat=1&lon=181','city=Unknown'])assert.throws(()=>prayerLocation(new URLSearchParams(q)));
 assert.equal(prayerLocation(new URLSearchParams('city=Jayapura')).zone,'Asia/Jayapura');
});
test('local date follows WIB/WITA/WIT across midnight instead of the UTC server date',()=>{
 const now=new Date('2026-10-26T16:30:00Z');
 assert.equal(prayerDate(now,'Asia/Jakarta'),'26-10-2026');assert.equal(prayerDate(now,'Asia/Makassar'),'27-10-2026');assert.equal(prayerDate(now,'Asia/Jayapura'),'27-10-2026');
 assert.equal(zoneLabel('Asia/Jakarta'),'WIB');assert.equal(zoneLabel('Asia/Makassar'),'WITA');assert.equal(zoneLabel('Asia/Jayapura'),'WIT');
});
test('location timezone from provider corrects an inaccurate device timezone and refetches the right day',async()=>{
 const urls=[];const fetcher=async url=>{urls.push(url);return Response.json({code:200,data:{meta:{timezone:'Asia/Jayapura'},timings:times}});};
 const result=await loadPrayerTimes(prayerLocation(new URLSearchParams('lat=-2.59&lon=140.67&timezone=Asia%2FJakarta')),new Date('2026-10-26T16:30:00Z'),fetcher);
 assert.equal(result.timeZone,'Asia/Jayapura');assert.equal(result.date,'27-10-2026');assert.equal(urls.length,2);assert.ok(urls[0].includes('/26-10-2026?'));assert.ok(urls[1].includes('/27-10-2026?'));assert.ok(urls[0].includes('latitude=-2.59&longitude=140.67'));assert.deepEqual(result.timings,times);
});
test('city fallback works and provider errors never become fabricated prayer times',async()=>{
 const location=prayerLocation(new URLSearchParams('city=Makassar'));
 const result=await loadPrayerTimes(location,new Date('2026-10-26T10:00:00Z'),async url=>{assert.ok(url.includes('/timingsByCity/'));return Response.json({code:200,data:{meta:{timezone:'Asia/Makassar'},timings:times}});});assert.equal(result.timeZone,'Asia/Makassar');
 for(const payload of [{code:500},{code:200,data:{meta:{timezone:'Invalid/Zone'},timings:times}},{code:200,data:{meta:{timezone:'Asia/Makassar'},timings:{...times,Fajr:'25:99'}}}])await assert.rejects(()=>loadPrayerTimes(location,new Date(),async()=>Response.json(payload)));
});
