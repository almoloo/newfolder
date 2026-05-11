import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'NewFolder',
		short_name: 'NewFolder',
		description:
			'Decentralized file storage with AI-powered chat, powered by 0G Network',
		icons: [
			{
				src: '/web-app-manifest-192x192.png',
				sizes: '192x192',
				type: 'image/png',
				purpose: 'maskable',
			},
			{
				src: '/web-app-manifest-512x512.png',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'maskable',
			},
		],
		theme_color: '#ff637e',
		background_color: '#ffffff',
		display: 'standalone',
	};
}
