'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '@/lib/web3/config';

interface AppProvidersProps {
	children: React.ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
	const [queryClient] = useState(() => new QueryClient());

	return (
		<QueryClientProvider client={queryClient}>
			<WagmiProvider config={wagmiConfig}>
				<RainbowKitProvider>{children}</RainbowKitProvider>
			</WagmiProvider>
		</QueryClientProvider>
	);
}
