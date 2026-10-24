'use client';
import { useEffect, useState } from 'react';
import { useWorkspace } from './workspace-provider';
import { hasModule } from '@/lib/mosque-workspace';
import { ENTERPRISE_MENU } from '@/lib/enterprise-menu';

export function MenuIcon({index}:{index:number}) {
  const paths=[
    'M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10',
    'M3 21h18M5 21V11h14v10M3 11h18M12 3 3 9h18ZM9 13v5M15 13v5',
    'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM3 21v-4a5 5 0 0 1 10 0v4ZM15 13a4 4 0 0 1 6 4v4h-5',
    'M3 16h5l3 3h6l4-6M3 21h5l2 1h7l5-8M12 11 7 6a3 3 0 0 1 5-3 3 3 0 0 1 5 3Z',
    'M8 3h8l-2 4H10ZM8 8c-4 4-5 7-5 10s3 4 9 4 9-1 9-4-1-6-5-10ZM14 11h-3a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-3M12 10v10',
    'M12 22V9M12 14C3 14 3 6 3 6s9 0 9 8ZM12 10c0-8 9-8 9-8s0 8-9 8ZM4 20h16',
    'M4 21V12h4v9ZM10 21V7h4v14ZM16 21V3h4v18Z',
    'M4 5h16v17H4ZM4 10h16M8 2v6M16 2v6M8 14h2v2H8ZM14 14h2v2h-2Z',
    'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 6v6l4 2',
    'M3 7 12 2l9 5v11l-9 5-9-5ZM3 7l9 5 9-5M12 12v11',
    'M8 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 21v-5a5 5 0 0 1 10 0v5ZM16 10a3 3 0 1 0 0-6M16 13a5 5 0 0 1 5 5v3h-5',
    'M3 9h18L19 3H5ZM4 9v13h16V9M8 22v-8h5v8M16 13h2v3h-2',
    'M3 9v6h5l10 5V4L8 9ZM8 15l2 7h4l-3-6M21 8v8',
    'M5 2h10l5 5v15H5ZM15 2v6h5M8 12h9M8 16h9M8 19h6',
    'm10 2 4 0 1 4 3 1 3-1 2 4-3 3 0 2 3 3-2 4-4-1-2 1-1 3h-4l-1-3-3-1-3 1-2-4 3-3v-2l-3-3 2-4 4 1 2-1ZM12 9a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  ];
  return <span className="brochure-menu-icon" aria-hidden="true"><svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><g transform="translate(2 1) scale(.9)"><path d={paths[index]||paths[0]}/></g></svg></span>;
}
export default function EnterpriseNavigation() {
  const {plan}=useWorkspace();
  const [active,setActive]=useState('dashboard');
  useEffect(()=>{
    const update=()=>setActive(window.location.hash.slice(1)||'dashboard');
    update(); window.addEventListener('hashchange',update);
    return()=>window.removeEventListener('hashchange',update);
  },[]);
  return <nav className="enterprise-navigation" aria-label="Menu utama">{ENTERPRISE_MENU.filter(menu=>hasModule(plan,menu.id)).map(menu=><a key={menu.id} href={'#'+menu.id} className={'side-link '+(active===menu.id?'current':'')} aria-current={active===menu.id?'page':undefined} onClick={()=>setActive(menu.id)}><MenuIcon index={menu.icon}/><span>{menu.label}</span></a>)}</nav>;
}
