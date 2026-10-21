'use client';
import { useEffect } from 'react';
export default function PwaRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    const registerWorker = () => { void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => { /* PWA remains usable online */ }); };
    if (document.readyState === 'complete') registerWorker();
    else window.addEventListener('load', registerWorker, { once: true });
    return () => window.removeEventListener('load', registerWorker);
  }, []);
  return null;
}
