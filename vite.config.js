import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
	server: {
		open: './public/',
		port: 5173,
		host: true // 设置为 true 表示监听所有地址
	},
	plugins: [
		svelte({emitCss: false,}), 
		wasm(),
		// topLevelAwait()
	]
})