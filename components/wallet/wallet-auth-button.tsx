'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import type {
	AddEthereumChainParameter,
	Chain,
	EIP1193RequestFn,
	WalletRpcSchema,
} from 'viem';
import { useEffect, useEffectEvent, useState } from 'react';
import { SiweMessage } from 'siwe';
import {
	useAccount,
	useChainId,
	useDisconnect,
	useSignMessage,
	useSwitchChain,
	useWalletClient,
} from 'wagmi';
import { useRouter, usePathname } from 'next/navigation';
import { authClient } from '@/lib/auth/client';
import { useToast } from '@/components/layout/toast';
import { requiredChain } from '@/lib/web3/config';

function formatAddress(address: string) {
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function toHexChainId(chainId: number) {
	return `0x${chainId.toString(16)}`;
}

async function addChainToWallet(
	request: EIP1193RequestFn<WalletRpcSchema> | undefined,
	chain: Chain,
) {
	if (!request) {
		throw new Error(
			'Wallet does not support adding chains programmatically.',
		);
	}

	const chainToAdd: AddEthereumChainParameter = {
		chainId: toHexChainId(chain.id),
		chainName: chain.name,
		nativeCurrency: chain.nativeCurrency,
		rpcUrls: chain.rpcUrls.default.http,
		blockExplorerUrls: chain.blockExplorers?.default?.url
			? [chain.blockExplorers.default.url]
			: undefined,
	};

	await request({
		method: 'wallet_addEthereumChain',
		params: [chainToAdd],
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
	const [shouldAutoSignIn, setShouldAutoSignIn] = useState(false);
	const toast = useToast();
	const router = useRouter();
	const pathname = usePathname();

	const isAuthenticated = Boolean(
		session.data?.session && session.data?.user,
	);
	const isOnRequiredChain = chainId === requiredChain.id;

	async function ensureRequiredChain() {
		if (chainId === requiredChain.id) {
			return;
		}

		try {
			await switchChainAsync({ chainId: requiredChain.id });
			return;
		} catch {
			await addChainToWallet(walletClient?.request, requiredChain);
			await switchChainAsync({ chainId: requiredChain.id });
		}
	}

	async function handleSignIn() {
		if (isSubmitting) {
			return;
		}

		if (!address || !isConnected) {
			toast.error('Connect a wallet before signing in.');
			return;
		}

		setIsSubmitting(true);

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
			toast.error(
				caughtError instanceof Error
					? caughtError.message
					: 'Unable to sign in with wallet.',
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	const runAutoSignIn = useEffectEvent(async () => {
		if (
			!shouldAutoSignIn ||
			!isConnected ||
			!address ||
			isAuthenticated ||
			isSubmitting
		) {
			return;
		}

		setShouldAutoSignIn(false);
		await handleSignIn();
	});

	useEffect(() => {
		if (shouldAutoSignIn && isConnected && !isAuthenticated) {
			void runAutoSignIn();
		}
	}, [isAuthenticated, isConnected, shouldAutoSignIn]);

	useEffect(() => {
		if (session.isPending) return;
		if (isAuthenticated && pathname === '/') {
			router.push('/dashboard');
		} else if (!isAuthenticated && pathname !== '/') {
			router.push('/');
		}
	}, [isAuthenticated, session.isPending, pathname]);

	function getPrimaryLabel(isConnectedToWallet: boolean) {
		if (!isConnectedToWallet) {
			return 'Connect wallet';
		}

		if (isSubmitting) {
			return 'Signing in...';
		}

		if (!isAuthenticated) {
			return 'Retry sign-in';
		}

		return address ? formatAddress(address) : 'Wallet';
	}

	async function handleSignOut() {
		setShouldAutoSignIn(false);
		await authClient.signOut();
		disconnect();
		session.refetch();
	}

	return (
		<ConnectButton.Custom>
			{({ account, mounted, openAccountModal, openConnectModal }) => {
				const ready = mounted;
				const connected = ready && Boolean(account) && isConnected;

				async function handlePrimaryAction() {
					if (!connected) {
						setShouldAutoSignIn(true);
						openConnectModal();
						return;
					}

					if (isAuthenticated) {
						openAccountModal();
						return;
					}

					await handleSignIn();
				}

				return (
					<div
						className="flex flex-col items-end gap-2"
						aria-hidden={!ready}
						style={
							!ready
								? {
										opacity: 0,
										pointerEvents: 'none',
										userSelect: 'none',
									}
								: undefined
						}
					>
						<div className="flex items-center gap-3">
							<button
								type="button"
								onClick={() => {
									void handlePrimaryAction();
								}}
								disabled={!ready || isSubmitting}
								className="rounded-full border border-black/10 bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
							>
								{getPrimaryLabel(connected)}
							</button>
							{isAuthenticated && address ? (
								<button
									type="button"
									onClick={() => {
										void handleSignOut();
									}}
									className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-black/5 dark:border-white/10 dark:text-zinc-100 dark:hover:bg-white/10"
								>
									Sign out
								</button>
							) : null}
						</div>
						{connected && !isAuthenticated ? (
							<p className="max-w-xs text-right text-xs text-zinc-500 dark:text-zinc-400">
								Approve the wallet prompts to switch to{' '}
								{requiredChain.name}
								and sign in.
							</p>
						) : null}
						{connected && !isAuthenticated && !isOnRequiredChain ? (
							<p className="max-w-xs text-right text-xs text-amber-600 dark:text-amber-400">
								The app will try to add {requiredChain.name}{' '}
								automatically if it is missing.
							</p>
						) : null}
					</div>
				);
			}}
		</ConnectButton.Custom>
	);
}
