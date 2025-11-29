import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: 'prompt',
			injectRegister: 'auto',
			includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'robots.txt'],
			manifest: {
				name: 'Easy Drive',
				short_name: 'Easy Drive',
				description: '',
				theme_color: '#0c2f51',
				background_color: '#0c2f51',
				display: 'standalone',
				orientation: 'portrait',
				start_url: '/',
				scope: '/',
				icons: [
					{
						src: '/icon-72x72.png',
						sizes: '72x72',
						type: 'image/png',
						purpose: 'any',
					},
					{
						src: '/icon-96x96.png',
						sizes: '96x96',
						type: 'image/png',
						purpose: 'any',
					},
					{
						src: '/icon-144x144.png',
						sizes: '144x144',
						type: 'image/png',
						purpose: 'any',
					},
					{
						src: '/icon-192x192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any',
					},
					{
						src: '/icon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any',
					},
					{
						src: '/icon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable',
					},
				],
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'supabase-cache',
							expiration: {
								maxEntries: 50,
								maxAgeSeconds: 60 * 60 * 24,
							},
							networkTimeoutSeconds: 10,
						},
					},
				],
				skipWaiting: true,
				clientsClaim: true,
			},
		}),
	],
	server: {
		host: '0.0.0.0',
		allowedHosts: ['.lhr.life'],
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
});
