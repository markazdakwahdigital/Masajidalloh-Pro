'use client';
import { useEffect, useState } from 'react';
import { ENTERPRISE_MENU } from '@/lib/enterprise-menu';

export function MenuIcon({index}:{index:number}) {
  return <span className="brochure-menu-icon" style={{backgroundPosition:`0 -${index*44}px`}} aria-hidden="true"/>;
}
export default function EnterpriseNavigation() {
  const [active,setActive]=useState('dashboard');
  useEffect(()=>{
    const update=()=>setActive(window.location.hash.slice(1)||'dashboard');
    update(); window.addEventListener('hashchange',update);
    return()=>window.removeEventListener('hashchange',update);
  },[]);
  return <nav className="enterprise-navigation" aria-label="Menu utama">{ENTERPRISE_MENU.map(menu=><a key={menu.id} href={'#'+menu.id} className={'side-link '+(active===menu.id?'current':'')} aria-current={active===menu.id?'page':undefined} onClick={()=>setActive(menu.id)}><MenuIcon index={menu.icon}/><span>{menu.label}</span></a>)}</nav>;
}
