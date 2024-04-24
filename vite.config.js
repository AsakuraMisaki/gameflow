import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	server: {
		open: '/index.html',
	},
	plugins: [svelte({emitCss: false,})]
})