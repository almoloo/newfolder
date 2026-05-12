import type { NextConfig } from 'next';

// 'unsafe-inline' for scripts: Next.js inline hydration scripts + theme-init script
// 'unsafe-eval' for scripts: required by WalletConnect / ethers.js crypto internals
// 'unsafe-inline' for styles: required by RainbowKit and Tailwind runtime
// connect-src https: wss:: allows 0G RPC, WalletConnect relay, and any HTTPS API
const CSP = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' data: https://fonts.gstatic.com;
  img-src 'self' data: blob: https:;
  connect-src 'self' https: wss: ws:;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
`
	.replace(/\n/g, ' ')
	.trim();

const nextConfig: NextConfig = {
	output: 'standalone',
	serverExternalPackages: ['pdf-parse', 'officeparser'],
	experimental: {
		optimizePackageImports: ['@phosphor-icons/react'],
	},
	async headers() {
		return [
			{
				source: '/(.*)',
				headers: [
					{ key: 'Content-Security-Policy', value: CSP },
					{ key: 'X-Frame-Options', value: 'DENY' },
					{ key: 'X-Content-Type-Options', value: 'nosniff' },
					{
						key: 'Referrer-Policy',
						value: 'strict-origin-when-cross-origin',
					},
				],
			},
		];
	},
};

export default nextConfig;
