import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: process.env.SITE_URL || 'https://gecxxxx.github.io',
  base: process.env.DEPLOY_BASE_PATH || '/',
  output: 'static',
  trailingSlash: 'always',
  outDir: './dist/client',
  integrations: [react()],
  server: { host: '0.0.0.0', allowedHosts: ['terminal.local'] },
  vite: { server: { allowedHosts: ['terminal.local'] } },
  devToolbar: { enabled: false },
});
