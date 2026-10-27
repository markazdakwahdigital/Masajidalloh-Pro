/** Indonesian display uses a dot for groups and a comma for fractional rupiah. */
export function formatRupiahTyping(input:string){
 const clean=input.replace(/[^0-9,]/g,'');const [whole,...fraction]=clean.split(',');
 const integer=whole.replace(/^0+(?=\d)/,'');
 return integer.replace(/\B(?=(\d{3})+(?!\d))/g,'.')+(fraction.length?','+fraction.join('').slice(0,2):'');
}
export function rupiahCanonical(display:string){const raw=display.replaceAll('.','').replace(',','.');return raw==='.'||raw===''?'':raw.startsWith('.')?'0'+raw:raw;}
export function rupiahDisplay(canonical:string){return formatRupiahTyping(canonical.replace('.',','));}
