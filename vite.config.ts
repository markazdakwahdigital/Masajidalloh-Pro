// Cloudflare Workers RSC build pilot. No production credentials or account IDs.
import { defineConfig } from 'vite';
import vinext from 'vinext';
import { cloudflare } from '@cloudflare/vite-plugin';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: [{find: /^@prisma\/client$/, replacement: fileURLToPath(new URL('./node_modules/.prisma/client/wasm.js', import.meta.url))}],
  },
  plugins: [
    vinext(),
    cloudflare({
      inspectorPort: process.env.CI ? false : undefined,
      viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
    }),
  ],
});
