import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

export default defineConfig({
  site: 'https://readdeepwell.com',
  output: 'static',
  outDir: process.env.ASTRO_OUT_DIR ?? './dist',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [svelte()],
  devToolbar: { enabled: false },
});
