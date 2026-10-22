import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url));
test('manifest provides install icons and standalone mode', () => {
  const m = JSON.parse(read('public/manifest.webmanifest').toString());
  assert.equal(m.display, 'standalone');
  assert.equal(m.start_url, '/?source=pwa');
  assert.deepEqual(m.icons.map(x => x.sizes), ['192x192', '512x512', '512x512']);
  for (const x of m.icons) assert.equal(read('public' + x.src).subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
});
test('service worker provides offline fallback without caching authenticated responses', () => {
  const s = read('public/sw.js').toString();
  assert.match(s, /event\.request\.mode !== 'navigate'/);
  assert.match(s, /fetch\(event\.request\)\.catch/);
  assert.doesNotMatch(s, /cache\.put\(/);
  assert.doesNotMatch(s, /caches\.open\([^)]*\)\.then\([^)]*cache\.add\(event\.request/);
});

test('installation guidance stays progressive and avoids caching private data', () => {
  const ui = read('src/app/install-app.tsx').toString();
  assert.match(ui, /beforeinstallprompt/);
  assert.match(ui, /appinstalled/);
  assert.match(ui, /Add to Home Screen/);
  const sw = read('public/sw.js').toString();
  assert.doesNotMatch(sw, /cache\.put\(/);
});
