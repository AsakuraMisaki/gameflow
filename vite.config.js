import { defineConfig } from 'vite'
// import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	server: {
		open: '/index.html',
		port: port,
		host: true // 设置为 true 表示监听所有地址
	},
	plugins: [
		// svelte({emitCss: false,}), 
		// wasm(),
		// topLevelAwait()
	]
})