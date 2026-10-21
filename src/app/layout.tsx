import type { Metadata, Viewport } from 'next';
import PwaRegistration from './pwa-registration';
import './globals.css';
export const metadata: Metadata = {
  title: 'MASAJIDALLOH PRO',
  description: 'Professional Mosque Management Platform',
  applicationName: 'MASAJIDALLOH PRO',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'MASAJIDALLOH PRO' },
  icons: { icon: [{ url: '/favicon.png', sizes: '192x192', type: 'image/png' }], apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }] },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#103d92' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}<PwaRegistration /></body></html>;
}
