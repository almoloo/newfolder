'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { Chain } from 'viem';
import { useState } from 'react';
import { SiweMessage } from 'siwe';
import {
	useAccount,
	useChainId,
	useDisconnect,
	useSignMessage,
	useSwitchChain,
	useWalletClient,
} from 'wagmi';
import { authClient } from '@/lib/auth/client';
import { requiredChain } from '@/lib/web3/config';

function formatAddress(address: string) {
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function toHexChainId(chainId: number) {
	return `0x${chainId.toString(16)}`;
}

async function addChainToWallet(
	request:
		| ((args: { method: string; params?: unknown[] }) => Promise<unknown>)
		| undefined,
	chain: Chain,
) {
	if (!request) {
		throw new Error(
			'Wallet does not support adding chains programmatically.',
		);
	}

	await request({
		method: 'wallet_addEthereumChain',
		params: [
			{
				chainId: toHexChainId(chain.id),
				chainName: chain.name,
				nativeCurrency: chain.nativeCurrency,
				rpcUrls: chain.rpcUrls.default.http,
				blockExplorerUrls: chain.blockExplorers?.default?.url
					? [chain.blockExplorers.default.url]
					: undefined,
			},
		],
	});
}

export default function WalletAuthButton() {
	const { address, isConnected } = useAccount();
	const chainId = useChainId();
	const { disconnect } = useDisconnect();
	const { data: walletClient } = useWalletClient();
	const { switchChainAsync } = useSwitchChain();
	const { signMessageAsync } = useSignMessage();
	const session = authClient.useSession();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const isAuthenticated = Boolean(
		session.data?.session && session.data?.user,
	);

	async function ensureRequiredChain() {
		if (chainId === requiredChain.id) {
			return;
		}

		try {
			await switchChainAsync({ chainId: requiredChain.id });
			return;
		} catch {
			await addChainToWallet(
				walletClient?.request.bind(walletClient),
				requiredChain,
			);
			await switchChainAsync({ chainId: requiredChain.id });
		}
	}

	async function handleSignIn() {
		if (!address || !isConnected) {
			setError('Connect a wallet before signing in.');
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			await ensureRequiredChain();

			const nonceResponse = await fetch('/api/auth/siwe/nonce', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					walletAddress: address,
					chainId: requiredChain.id,
				}),
			});

			if (!nonceResponse.ok) {
				throw new Error('Unable to create a SIWE nonce.');
			}

			const { nonce } = (await nonceResponse.json()) as { nonce: string };

			const message = new SiweMessage({
				domain: window.location.host,
				address,
				statement: 'Sign in to access your AI vault.',
				uri: window.location.origin,
				version: '1',
				chainId: requiredChain.id,
				nonce,
			}).prepareMessage();

			const signature = await signMessageAsync({
				message,
			});

			const verifyResponse = await fetch('/api/auth/siwe/verify', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					message,
					signature,
					walletAddress: address,
					chainId: requiredChain.id,
					email: `${address.toLowerCase()}@wallet.local`,
				}),
			});

			if (!verifyResponse.ok) {
				throw new Error('Wallet signature verification failed.');
			}

			session.refetch();
		} catch (caughtError) {
			setError(
				caughtError instanceof Error
					? caughtError.message
					: 'Unable to sign in with wallet.',
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleSignOut() {
		setError(null);
		await authClient.signOut();
		disconnect();
		session.refetch();
	}

	return (
		<div className="flex flex-col items-end gap-2">
			<div className="flex items-center gap-3">
				<ConnectButton />
				{isConnected && !isAuthenticated ? (
					<button
						type="button"
						onClick={handleSignIn}
						disabled={isSubmitting}
						className="rounded-full border border-black/10 bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
					>
						{isSubmitting ? 'Signing in...' : 'Sign in'}
					</button>
				) : null}
				{isAuthenticated && address ? (
					<button
						type="button"
						onClick={handleSignOut}
						className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-black/5 dark:border-white/10 dark:text-zinc-100 dark:hover:bg-white/10"
					>
						Sign out {formatAddress(address)}
					</button>
				) : null}
			</div>
			{isConnected && chainId !== requiredChain.id ? (
				<p className="max-w-xs text-right text-xs text-amber-600 dark:text-amber-400">
					Switch to {requiredChain.name} to sign in. The app will try
					to add it to your wallet automatically if it is missing.
				</p>
			) : null}
			{error ? (
				<p className="max-w-xs text-right text-xs text-red-600 dark:text-red-400">
					{error}
				</p>
			) : null}
		</div>
	);
}
