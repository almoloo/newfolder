'use client';

import { useState } from 'react';
import {
	useAccount,
	useChainId,
	useSendTransaction,
	useSwitchChain,
	useWalletClient,
} from 'wagmi';
import type { Chain, EIP1193RequestFn, WalletRpcSchema } from 'viem';
import { parseEther } from 'viem';
import { type TopupStep, topupStepLabels } from '@/lib/types/ui';
import { contractAddress, requiredChain, wagmiConfig } from '@/lib/web3/config';
import { waitForTransactionReceipt } from 'wagmi/actions';

async function addChainToWallet(
	request: EIP1193RequestFn<WalletRpcSchema> | undefined,
	chain: Chain,
) {
	if (!request) {
		throw new Error('Wallet does not support programmatic chain addition.');
	}
	await request({
		method: 'wallet_addEthereumChain',
		params: [
			{
				chainId: `0x${chain.id.toString(16)}`,
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

export default function Topup() {
	const [amount, setAmount] = useState('');
	const [step, setStep] = useState<TopupStep>('idle');
	const [error, setError] = useState<string | null>(null);
	const [topupId, setTopupId] = useState<string | null>(null);

	const { address } = useAccount();
	const chainId = useChainId();
	const { data: walletClient } = useWalletClient();
	const { switchChainAsync } = useSwitchChain();
	const { sendTransactionAsync } = useSendTransaction();

	const isBusy = step !== 'idle' && step !== 'done';

	async function ensureRequiredChain() {
		if (chainId === requiredChain.id) return;
		setStep('switching-chain');
		try {
			await switchChainAsync({ chainId: requiredChain.id });
		} catch {
			await addChainToWallet(walletClient?.request, requiredChain);
			await switchChainAsync({ chainId: requiredChain.id });
		}
	}

	async function handleTransaction() {
		if (!address) {
			setError('Wallet not connected');
			return;
		}

		const parsed = parseFloat(amount);
		if (!amount || isNaN(parsed) || parsed <= 0) {
			setError('Invalid amount');
			return;
		}

		if (!contractAddress) {
			setError('Contract address not configured');
			return;
		}

		setError(null);
		setTopupId(null);

		try {
			await ensureRequiredChain();

			setStep('awaiting-signature');
			const hash = await sendTransactionAsync({
				to: contractAddress,
				value: parseEther(amount),
			});

			setStep('awaiting-confirmation');
			const receipt = await waitForTransactionReceipt(wagmiConfig, {
				hash,
			});

			setStep('registering');
			const res = await fetch('/api/topups', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					walletAddress: address,
					chainId: requiredChain.id,
					amount: parseEther(amount).toString(),
					txHash: receipt.transactionHash,
					status: 'confirmed',
					blockNumber: String(receipt.blockNumber),
				}),
			});

			if (!res.ok) {
				const body = (await res.json()) as { error?: string };
				throw new Error(body.error || 'Failed to register topup');
			}

			const topup = (await res.json()) as { id: string };
			setTopupId(topup.id);
			setStep('done');
			setAmount('');
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: 'An unknown error occurred',
			);
			setStep('idle');
		}
	}

	return (
		<div className="border p-5 m-5 flex flex-col">
			<h2>Topup</h2>
			<input
				placeholder="Amount (e.g. 0.01)"
				type="number"
				min="0"
				step="any"
				value={amount}
				onChange={(e) => setAmount(e.target.value)}
				className="bg-gray-100 border p-2"
				disabled={isBusy}
			/>
			<button
				className="bg-sky-500 p-3 disabled:bg-gray-500"
				onClick={handleTransaction}
				disabled={isBusy || step === 'done'}
			>
				{topupStepLabels[step]}
			</button>
			{error && <p className="text-red-500 text-sm">{error}</p>}
			{topupId && (
				<p className="text-green-600 text-sm">
					Topup registered — ID: {topupId}
				</p>
			)}
		</div>
	);
}
