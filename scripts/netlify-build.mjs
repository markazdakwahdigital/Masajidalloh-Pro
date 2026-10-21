/** Netlify CLI local build: isolate GitHub secrets from Netlify masked build vars. */
import { spawnSync } from 'node:child_process';
const env = {...process.env};
if (env.MDD_DEPLOY_DATABASE_URL && env.MDD_DEPLOY_PUBLISHABLE_KEY) {
  env.DATABASE_URL = env.MDD_DEPLOY_DATABASE_URL;
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = env.MDD_DEPLOY_PUBLISHABLE_KEY;
  env.NEXT_PUBLIC_SUPABASE_URL = 'https://vsbvyhghggvzoanozvvw.supabase.co';
}
delete env.MDD_DEPLOY_DATABASE_URL;
delete env.MDD_DEPLOY_PUBLISHABLE_KEY;
for (const [command, args] of [
  ['node', ['scripts/check-deploy-env.mjs']],
  ['npm', ['run', 'db:generate']],
  ['npm', ['run', 'build']],
]) {
  const result = spawnSync(command, args, {env, stdio:'inherit', shell:false});
  if (result.error) {
    console.error('Build command could not start; command values remain hidden.');
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status || 1);
}
