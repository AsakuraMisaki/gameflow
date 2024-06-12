import { defineConfig } from 'vite'
// import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	server: {
		open: './public/theatresupport.html',
		port: 5173,
		host: true // 设置为 true 表示监听所有地址
	},
	plugins: [
		// svelte({emitCss: false,}), 
		// wasm(),
		// topLevelAwait()
	]
})