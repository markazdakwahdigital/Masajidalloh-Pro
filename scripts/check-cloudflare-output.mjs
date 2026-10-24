import assert from 'node:assert/strict';
import { readFileSync, statSync, readdirSync } from 'node:fs';
import { resolve, sep } from 'node:path';
const root = resolve('.cloudflare/output/v0/workers/default');
const config = JSON.parse(readFileSync(resolve(root, 'worker.config.json'), 'utf8'));
assert.equal(typeof config.manifest?.mainModule, 'string', 'Missing server entrypoint: assets-only build is not deployable');
const main = resolve(root, 'bundle', config.manifest.mainModule);
assert.ok(main.startsWith(root + sep), 'Worker entrypoint escapes output directory');
assert.ok(statSync(main).size > 4096, 'Worker entry module is missing or unexpectedly small');
console.log(`PASS Worker manifest references a server module (${statSync(main).size} bytes)`);

const modules = readdirSync(resolve(root, 'bundle'), {recursive:true});
assert.ok(!modules.some(file => /query_compiler_bg.*\.wasm$/.test(String(file))), 'Runtime must use authenticated HTTPS RPC without a Prisma compiler');
const serverCode = modules.filter(file => String(file).endsWith('.js')).map(file => readFileSync(resolve(root, 'bundle', String(file)), 'utf8')).join('\n');
assert.ok(serverCode.includes('mp_workspace') && serverCode.includes('mp_save_record'), 'Authenticated tenant RPC routes must be bundled');
console.log('PASS authenticated HTTPS tenant RPC is bundled without the Prisma runtime');
