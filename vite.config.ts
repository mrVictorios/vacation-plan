import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Vite config for a Svelte SPA
export default defineConfig({
  plugins: [svelte()],
  // Adjust base if your repo name differs
  base: '/vacation-plan/',
});
