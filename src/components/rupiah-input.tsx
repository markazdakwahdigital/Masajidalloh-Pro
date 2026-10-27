'use client';
import {useEffect,useRef,useState} from 'react';
import {formatRupiahTyping,rupiahCanonical,rupiahDisplay} from '@/lib/rupiah-input';
export default function RupiahInput({name,initial='',required=false}:{name:string;initial?:string;required?:boolean}){
 const [display,setDisplay]=useState(()=>rupiahDisplay(initial));const ref=useRef<HTMLInputElement>(null);
 useEffect(()=>{const input=ref.current,form=input?.form;if(!form)return;const reset=()=>{setDisplay(rupiahDisplay(initial));input?.setCustomValidity('');};form.addEventListener('reset',reset);return()=>form.removeEventListener('reset',reset);},[initial]);
 return <><input ref={ref} type="text" inputMode="decimal" value={display} placeholder="Contoh: 1.000.000" required={required} maxLength={30} onChange={event=>{
 const input=event.currentTarget;const before=input.value.slice(0,input.selectionStart??input.value.length).replace(/[^0-9,]/g,'').length;const next=formatRupiahTyping(input.value),raw=rupiahCanonical(next),number=Number(raw);
 input.setCustomValidity(raw&&(!Number.isFinite(number)||number<0.01||number>1e12)?'Nominal harus antara Rp 0,01 dan Rp 1.000.000.000.000.':'');setDisplay(next);
 requestAnimationFrame(()=>{let count=0,index=0;while(index<next.length&&count<before){if(/[0-9,]/.test(next[index]))count++;index++;}if(document.activeElement===input)input.setSelectionRange(index,index);});
 }}/><input name={name} type="hidden" value={rupiahCanonical(display)}/><small>Pemisah ribuan otomatis. Gunakan koma untuk sen, misalnya 10.000,50.</small></>;
}
