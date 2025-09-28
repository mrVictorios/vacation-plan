import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('svelte/types').SvelteConfig} */
const config = {
  preprocess: vitePreprocess(),
};

export default config;

