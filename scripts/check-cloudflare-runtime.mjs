import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

// Only local workerd and dummy configuration. Never uses a production account.
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
  env: { ...process.env, CI: 'true', DATABASE_URL: 'postgresql://test:test@localhost:5432/test', NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_local_test' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
server.stdout.on('data', data => { logs += data; });
server.stderr.on('data', data => { logs += data; });
const base = 'http://127.0.0.1:4173';
const request = path => fetch(base + path, { redirect: 'manual', signal: AbortSignal.timeout(10000) });
try {
  let ready = false;
  for (let attempt = 0; attempt < 90; attempt++) {
    if (server.exitCode !== null) throw new Error('Worker preview exited before becoming ready');
    try { if ((await request('/api/health')).ok) { ready = true; break; } } catch { /* starting */ }
    await delay(1000);
  }
  assert.ok(ready, 'Worker did not become ready within 90 seconds');
  assert.deepEqual(await (await request('/api/health')).json(), {status: 'ok', service: 'masajidalloh-pro', check: 'liveness'});
  for (const [path, marker] of [['/', 'MASAJIDALLOH'], ['/login', 'Masuk ke Dashboard Masjid'], ['/paket', 'MASAJIDALLOH'], ['/daftar-masjid', 'Masjid']]) {
    const response = await request(path);
    assert.equal(response.status, 200, `${path} must render on workerd`);
    const body = await response.text();
    assert.ok(body.includes(marker), `${path} missing expected HTML`);
    assert.ok(!body.includes('postgresql://test'), 'Database URL leaked into HTML');
    console.log(`PASS ${path}: server-rendered HTML`);
  }
  for (const path of ['/dashboard', '/dashboard/masjid/00000000-0000-0000-0000-000000000000']) {
    const response = await request(path);
    assert.ok([302, 303, 307, 308].includes(response.status), `${path} must reject anonymous access`);
    assert.equal(new URL(response.headers.get('location'), base).pathname, '/login');
    console.log(`PASS ${path}: anonymous user redirected`);
  }
  // Submit the real progressive-enhancement form with invalid empty fields.
  // Validation must redirect before making any request to Supabase.
  const loginHtml = await (await request('/login')).text();
  const actionName = loginHtml.match(/name="(\$ACTION_ID_[^"]+)"/)?.[1];
  assert.ok(actionName, 'Login form must expose its server action');
  const form = new FormData();
  form.set(actionName, '');
  form.set('email', '');
  form.set('password', '');
  const invalidLogin = await fetch(base + '/login', {
    method: 'POST', body: form, redirect: 'manual',
    headers: { origin: base }, signal: AbortSignal.timeout(10000),
  });
  assert.ok([302, 303, 307, 308].includes(invalidLogin.status), 'Login server action must redirect');
  const invalidLocation = new URL(invalidLogin.headers.get('location'), base);
  assert.equal(invalidLocation.pathname, '/login');
  assert.equal(invalidLocation.searchParams.get('error'), 'invalid');
  console.log('PASS login form Server Action rejects invalid input');
  const manifest = await request('/manifest.webmanifest');
  assert.equal(manifest.status, 200);
  assert.equal((await manifest.json()).display, 'standalone');
  assert.equal((await request('/icons/icon-192.png')).status, 200);
  assert.equal((await request('/sw.js')).status, 200);
  console.log('PASS Worker health, SSR, anonymous access and PWA assets (no database/auth network test)');
} catch (error) {
  console.error(logs.slice(-16000));
  throw error;
} finally {
  server.kill('SIGTERM');
}
