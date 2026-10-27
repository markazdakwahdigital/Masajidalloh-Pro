export const PUBLIC_APP_ORIGIN='https://masajidalloh-pro.markazdakwahdigital-01.workers.dev';
export function publicMosquePath(id:string){
 if(!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id))throw new Error('invalid_mosque_id');
 return '/dashboard/masjid/'+id.toLowerCase();
}
export function publicMosqueUrl(id:string){return PUBLIC_APP_ORIGIN+publicMosquePath(id);}
export function mosqueManifest(id:string,name:string){
 const path=publicMosquePath(id);
 return {id:path,name,short_name:name.slice(0,40),description:'Dashboard publik '+name+' — Donasi, Infaq, Shodaqoh dan laporan Masjid.',lang:'id',dir:'ltr',start_url:path,scope:path,display:'standalone',background_color:'#edf6ff',theme_color:'#103d92',icons:[{src:'/icons/icon-192.png?v=3',sizes:'192x192',type:'image/png',purpose:'any'},{src:'/icons/icon-512.png?v=3',sizes:'512x512',type:'image/png',purpose:'any'},{src:'/icons/icon-maskable-512.png?v=3',sizes:'512x512',type:'image/png',purpose:'maskable'}]};
}

/** Fresh social URL; canonical installation/QR URLs remain stable. */
export function publicMosqueShareUrl(id:string){return publicMosqueUrl(id)+'?bagikan=logo4';}
