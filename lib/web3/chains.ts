import { defineChain } from 'viem';
import { zeroGMainnet } from 'wagmi/chains';

// viem/wagmi ship chain ID 16601 but the live network reports 16602
export const zeroGGalileoTestnet = defineChain({
	id: 16_602,
	name: '0G Galileo Testnet',
	nativeCurrency: { name: 'A0GI', symbol: 'A0GI', decimals: 18 },
	rpcUrls: {
		default: { http: ['https://evmrpc-testnet.0g.ai'] },
	},
	blockExplorers: {
		default: {
			name: '0G BlockChain Explorer',
			url: 'https://chainscan-galileo.0g.ai',
		},
	},
	testnet: true,
});

export { zeroGMainnet };

export const supportedChains = [zeroGGalileoTestnet, zeroGMainnet] as const;

const isTestnet = process.env.NEXT_PUBLIC_IS_TESTNET === 'true';
export const requiredChain = isTestnet ? zeroGGalileoTestnet : zeroGMainnet;

export const contractAddress = process.env.NEXT_PUBLIC_CREDIT_VAULT_ADDRESS as
	| `0x${string}`
	| undefined;
