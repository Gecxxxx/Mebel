import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const astroPackage = JSON.parse(readFileSync('node_modules/astro/package.json', 'utf8'));
const bin = typeof astroPackage.bin === 'string' ? astroPackage.bin : astroPackage.bin.astro;
const result = spawnSync(process.execPath, [resolve('node_modules/astro', bin), 'build'], {
  stdio: 'inherit',
  env: { ...process.env, SITE_URL: 'https://prioritetmebel48.ru', DEPLOY_BASE_PATH: '/', PUBLIC_INDEXABLE: 'true' },
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
await import('./prepare-sites-build.mjs');
