import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const script = 'scripts/check-deploy-env.mjs';
const baseEnv = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL:'https://vsbvyhghggvzoanozvvw.supabase.co',
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_example_only',
  DATABASE_URL:'postgresql://postgres.example:my_test_password@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require'
};
function run(env) {
  return spawnSync(process.execPath,[script],{env,encoding:'utf8'});
}
test('accepts syntactically valid Supabase configuration without exposing secrets',()=>{
  const r=run(baseEnv);
  assert.equal(r.status,0,r.stderr);
  assert.doesNotMatch(r.stdout+r.stderr,/my_test_password/);
});
test('fails closed if password is still placeholder; hides credentials',()=>{
  const r=run({...baseEnv,DATABASE_URL:'postgresql://postgres.example:YOUR-PASSWORD@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres'});
  assert.equal(r.status,1);
  assert.match(r.stderr,/DATABASE_URL/);
  assert.doesNotMatch(r.stderr,/YOUR-PASSWORD/);
});
test('fails closed if publishable key missing',()=>{
  const r=run({...baseEnv,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:''});
  assert.equal(r.status,1);
  assert.match(r.stderr,/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
});
test('rejects wrong project URL',()=>{
  const r=run({...baseEnv,NEXT_PUBLIC_SUPABASE_URL:'https://wrong.supabase.co'});
  assert.equal(r.status,1);
  assert.match(r.stderr,/NEXT_PUBLIC_SUPABASE_URL/);
});
