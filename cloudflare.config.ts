// Experimental Cloudflare Vite Plugin v2 typed config.
// No account ID, tokens, or database credentials are committed.
import { defineConfig } from 'cf/config';

export default defineConfig({
  worker: {
    name: 'masajidalloh-pro-pilot',
    compatibilityDate: '2026-10-23',
    compatibilityFlags: ['nodejs_compat'],
  },
});
