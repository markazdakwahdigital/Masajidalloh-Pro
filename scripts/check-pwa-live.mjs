/** Read-only PWA smoke test for published Netlify pages; never requests credentials. */
const origin = (process.env.MDD_SITE_ORIGIN || 'https://masajidallohpro.netlify.app').replace(/\/$/, '');
const expected = [
  ['/', 'text/html'],
  ['/manifest.webmanifest', 'application/manifest+json'],
  ['/sw.js', 'javascript'],
  ['/offline.html', 'text/html'],
  ['/icons/icon-192.png', 'image/png'],
  ['/icons/icon-512.png', 'image/png'],
  ['/icons/icon-maskable-512.png', 'image/png'],
  ['/apple-touch-icon.png', 'image/png'],
  ['/brand/logo.webp', 'image/webp'],
  ['/api/health', 'application/json'],
];
let errors = 0;
for (const [path, mime] of expected) {
  let response;
  for (let tries = 0; tries < 4; tries++) {
    try {
      response = await fetch(origin + path, { redirect: 'follow', signal: AbortSignal.timeout(14000), cache: 'no-store' });
      if (response.ok) break;
    } catch { /* deploy CDN may be propagating */ }
    if (tries < 3) await new Promise(resolve => setTimeout(resolve, 2500));
  }
  if (!response?.ok) {
    console.error('[PWA] FAIL ' + path + ': HTTP ' + (response?.status ?? 'network error')); errors++; continue;
  }
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes(mime) && !(path === '/manifest.webmanifest' && contentType.includes('json'))) {
    console.error('[PWA] FAIL ' + path + ': unexpected content type'); errors++; continue;
  }
  if (path === '/manifest.webmanifest') {
    const manifest = await response.json();
    if (manifest.display !== 'standalone' || !Array.isArray(manifest.icons) || manifest.icons.length < 3) {
      console.error('[PWA] FAIL manifest content'); errors++; continue;
    }
  } else if (path === '/api/health') {
    const body = await response.json();
    if (body.status !== 'ok') { console.error('[PWA] FAIL liveness'); errors++; continue; }
  } else if (path.endsWith('.png')) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length < 1000 || [...bytes.slice(0, 8)].join(',') !== '137,80,78,71,13,10,26,10') {
      console.error('[PWA] FAIL PNG bytes ' + path); errors++; continue;
    }
  } else if (path === '/sw.js') {
    const code = await response.text();
    if (!code.includes('offline.html') || !code.includes('fetch(event.request)')) {
      console.error('[PWA] FAIL service worker'); errors++; continue;
    }
  }
  console.log('[PWA] OK ' + path);
}
if (errors) {
  console.error('[PWA] ' + errors + ' smoke checks failed.');
  process.exitCode = 1;
} else {
  console.log('[PWA] All live endpoint checks passed. Browser installability still requires on-device testing.');
}
