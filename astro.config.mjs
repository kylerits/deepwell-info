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
  // Astro builds the client for esnext, which Vite also uses as the CSS target, so the minifier
  // strips prefixes such as -webkit-backdrop-filter (Safari ≤ 17). Pin CSS to Vite's baseline.
  vite: { build: { cssTarget: ['chrome111', 'edge111', 'firefox114', 'safari16.4', 'ios16.4'] } },
});
