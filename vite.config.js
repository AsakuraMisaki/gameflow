import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte';
import wasm from "vite-plugin-wasm";
// import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
	server: {
		open: '/index.html',
	},
	plugins: [
		svelte({emitCss: false,}), 
		wasm(),
		// topLevelAwait()
	]
})