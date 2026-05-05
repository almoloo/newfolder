import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	// Produce a self-contained server in .next/standalone for Docker deployments.
	// Copy .next/standalone → image, then add .next/static and public on top.
	output: 'standalone',
};

export default nextConfig;
