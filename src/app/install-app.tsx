'use client';
import { useEffect, useState } from 'react';

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function InstallApp() {
  const [event, setEvent] = useState<DeferredInstallPrompt | null>(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [guide, setGuide] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)');
    const isStandalone = () => media.matches || Boolean((navigator as Navigator & {standalone?:boolean}).standalone);
    setInstalled(isStandalone());
    const agent = navigator.userAgent;
    setIos(/iPad|iPhone|iPod/i.test(agent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    const onPrompt = (e: Event) => { e.preventDefault(); setEvent(e as DeferredInstallPrompt); };
    const onInstalled = () => { setInstalled(true); setEvent(null); setGuide(false); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); };
  }, []);
  if (installed) return null;
  return <aside className="pwa-install">
    <div>
      <strong>Pasang MASAJIDALLOH PRO</strong>
      <p>Buka lebih mudah dari ikon di layar perangkat Anda. Data Masjid tetap memerlukan koneksi internet.</p>
    </div>
    {event ? <button type="button" onClick={async () => { await event.prompt(); await event.userChoice; setEvent(null); }}>Instal aplikasi</button> :
      <button type="button" onClick={() => setGuide(x => !x)} aria-expanded={guide}>Cara memasang</button>}
    {guide && <p className="pwa-install-guide">{ios ? 'Di Safari, ketuk Bagikan (Share), lalu pilih Tambahkan ke Layar Utama (Add to Home Screen).' : 'Android: di menu Chrome/Edge pilih Instal aplikasi atau Tambahkan ke layar utama. Desktop Chrome/Edge: gunakan ikon instalasi di bilah alamat atau menu browser. Pilihan ini bergantung pada browser dan perangkat.'}</p>}
  </aside>;
}
