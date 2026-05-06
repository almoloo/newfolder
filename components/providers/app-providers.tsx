'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
	RainbowKitProvider,
	darkTheme,
	lightTheme,
} from '@rainbow-me/rainbowkit';
import { useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '@/lib/web3/config';
import { IconContext } from '@phosphor-icons/react';
import { ThemeProvider, useTheme } from '@/components/providers/theme-provider';

interface AppProvidersProps {
	children: React.ReactNode;
}

function RainbowKitWithTheme({ children }: { children: React.ReactNode }) {
	const { theme } = useTheme();
	return (
		<RainbowKitProvider
			theme={theme === 'dark' ? darkTheme() : lightTheme()}
		>
			{children}
		</RainbowKitProvider>
	);
}

export default function AppProviders({ children }: AppProvidersProps) {
	const [queryClient] = useState(() => new QueryClient());

	return (
		<ThemeProvider>
			<QueryClientProvider client={queryClient}>
				<WagmiProvider config={wagmiConfig}>
					<RainbowKitWithTheme>
						<IconContext.Provider
							value={{
								size: 32,
								weight: 'bold',
								mirrored: false,
							}}
						>
							{children}
						</IconContext.Provider>
					</RainbowKitWithTheme>
				</WagmiProvider>
			</QueryClientProvider>
		</ThemeProvider>
	);
}
