import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { zeroGGalileoTestnet } from 'wagmi/chains';

const walletConnectProjectId =
	process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? 'demo';

export const supportedChains = [zeroGGalileoTestnet] as const;
export const requiredChain = zeroGGalileoTestnet;

export const wagmiConfig = getDefaultConfig({
	appName: 'NewFolder',
	appDescription: 'AI-native personal file vault',
	appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
	projectId: walletConnectProjectId,
	chains: supportedChains,
	ssr: true,
});
