'use client';
import {useState} from 'react';
export default function PublicDashboardShare({mosqueId,name}:{mosqueId:string;name:string}){
 const [message,setMessage]=useState(''),[fallback,setFallback]=useState('');
 const url=()=>new URL('/dashboard/masjid/'+encodeURIComponent(mosqueId),window.location.origin).href;
 async function copy(){const link=url();try{await navigator.clipboard.writeText(link);setMessage('Tautan dashboard publik disalin. Penerima dapat membuka tanpa login.');setFallback('');}catch{setFallback(link);setMessage('Salin tautan di bawah ini untuk dibagikan.');}}
 async function share(){if(!navigator.share){await copy();return;}try{await navigator.share({title:'Dashboard '+name,text:'Laporan publik '+name+' — dapat dibuka tanpa login.',url:url()});}catch(e){if(!(e instanceof Error&&e.name==='AbortError'))await copy();}}
 return <span className="public-share"><button type="button" onClick={copy}>Salin Tautan</button><button type="button" onClick={share}>Bagikan Dashboard</button>{message&&<span role="status">{message}</span>}{fallback&&<a href={fallback}>{fallback}</a>}</span>;
}
