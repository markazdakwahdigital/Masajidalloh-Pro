// Cloudflare Workers RSC build pilot. No production credentials or account IDs.
import { defineConfig } from 'vite';
import vinext from 'vinext';
import { cloudflare } from '@cloudflare/vite-plugin';

export default defineConfig({
  plugins: [
    vinext(),
    cloudflare({
      inspectorPort: process.env.CI ? false : undefined,
      viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
    }),
  ],
});
