import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { zeroGGalileoTestnet, zeroGMainnet } from 'wagmi/chains';

const walletConnectProjectId =
	process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? 'demo';
const isTestnet = process.env.NEXT_PUBLIC_IS_TESTNET === 'true';

export const supportedChains = [zeroGGalileoTestnet, zeroGMainnet] as const;
export const requiredChain = isTestnet ? zeroGGalileoTestnet : zeroGMainnet;

export const wagmiConfig = getDefaultConfig({
	appName: 'NewFolder',
	appDescription: 'AI-native personal file vault',
	appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
	projectId: walletConnectProjectId,
	chains: supportedChains,
	ssr: true,
});
