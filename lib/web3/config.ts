'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';

export {
	zeroGGalileoTestnet,
	zeroGMainnet,
	supportedChains,
	requiredChain,
	contractAddress,
} from './chains';

const walletConnectProjectId =
	process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? 'demo';

import { supportedChains } from './chains';

export const wagmiConfig = getDefaultConfig({
	appName: 'NewFolder',
	appDescription: 'AI-native personal file vault',
	appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
	projectId: walletConnectProjectId,
	chains: supportedChains,
	ssr: true,
});
