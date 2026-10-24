'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';

export default function SidebarDrawer({sidebar,children}:{sidebar:ReactNode;children:ReactNode}) {
  const [open,setOpen]=useState(false);
  const trigger=useRef<HTMLButtonElement>(null);
  const panel=useRef<HTMLElement>(null);
  function close(){setOpen(false);trigger.current?.focus({preventScroll:true});}
  useEffect(()=>{
    if(!open)return;
    const previous=document.body.style.overflow;
    document.body.style.overflow='hidden';
    panel.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return()=>{document.body.style.overflow=previous;};
  },[open]);
  return <div className="premium-app brochure-app drawer-layout" id="dashboard">
    <button ref={trigger} className="sidebar-trigger" type="button" aria-label="Buka menu navigasi" aria-controls="masjid-sidebar" aria-expanded={open} onClick={()=>setOpen(true)}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
    {open&&<div className="sidebar-backdrop" aria-hidden="true" onClick={close}/>}
    <aside ref={panel} id="masjid-sidebar" className="premium-sidebar drawer-panel" role="dialog" aria-modal="true" aria-label="Navigasi MASAJIDALLOH PRO" hidden={!open}
      onClick={event=>{if((event.target as HTMLElement).closest('a'))close();}}
      onKeyDown={event=>{
        if(event.key==='Escape'){event.preventDefault();close();return;}
        if(event.key!=='Tab')return;
        const items=panel.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])');
        if(!items?.length)return;
        const first=items[0],last=items[items.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }}>
      <button type="button" className="sidebar-close" aria-label="Tutup menu navigasi" onClick={close}>×</button>
      {sidebar}
    </aside>
    <div className="drawer-page" inert={open}>{children}</div>
  </div>;
}
