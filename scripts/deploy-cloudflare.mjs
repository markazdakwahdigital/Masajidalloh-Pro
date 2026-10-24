import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Supply runtime secrets on the first deployment, including when the existing
// Worker is assets-only and the dashboard cannot add runtime bindings yet.
const names = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];
const secrets = Object.fromEntries(names.map(name => [name, process.env[name]]));
const missing = names.filter(name => !secrets[name]);
if (missing.length) {
  console.error(`Missing required build secrets: ${missing.join(', ')}`);
  process.exit(1);
}
for (const name of ['DATABASE_URL','DKM_DRIVE_WEB_APP_URL','DKM_DRIVE_SIGNING_KEY']) { if (process.env[name]) secrets[name]=process.env[name]; }
const directory = mkdtempSync(join(tmpdir(), 'masajidalloh-deploy-'));
try {
  const file = join(directory, 'secrets.json');
  writeFileSync(file, JSON.stringify(secrets), { mode: 0o600 });
  const args = ['node_modules/cf/bin/cf', 'deploy', '--prebuilt', '--mode', 'production', '--no-provision', '--secrets-file', file];
  if (process.argv.includes('--dry-run')) args.push('--dry-run');
  const result = spawnSync(process.execPath, args, { stdio: 'inherit', env: process.env });
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(directory, { recursive: true, force: true });
}
