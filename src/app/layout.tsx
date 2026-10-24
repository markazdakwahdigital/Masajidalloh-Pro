import type { Metadata, Viewport } from 'next';
import PwaRegistration from './pwa-registration';
import BrandSplash from './brand-splash';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL('https://masajidalloh-pro.markazdakwahdigital-01.workers.dev'),
  title: 'MASAJIDALLOH PRO',
  description: 'Professional Mosque Management Platform',
  applicationName: 'MASAJIDALLOH PRO',
  openGraph: {title:'MASAJIDALLOH PRO',description:'Professional Mosque Management Platform · Masjid Makmur, Adaptif dan Berdaya',type:'website',locale:'id_ID',images:[{url:'/brand/share-logo-v3.png',width:640,height:640,alt:'Logo resmi MASAJIDALLOH PRO'}]},
  twitter: {card:'summary',title:'MASAJIDALLOH PRO',description:'Professional Mosque Management Platform',images:['/brand/share-logo-v3.png']},
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'MASAJIDALLOH PRO' },
  icons: { icon: [{ url: '/favicon.png?v=3', sizes: '192x192', type: 'image/png' }], apple: [{ url: '/apple-touch-icon.png?v=3', sizes: '180x180', type: 'image/png' }] },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#103d92' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body><BrandSplash />{children}<PwaRegistration /></body></html>;
}
