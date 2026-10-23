// Experimental vinext build configuration for compatibility testing only.
// Cloudflare production runtime and database adapter are NOT configured yet.
import { defineConfig } from 'vite';
import vinext from 'vinext';

export default defineConfig({
  plugins: [vinext()],
});
