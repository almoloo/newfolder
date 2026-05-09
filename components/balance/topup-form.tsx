'use client';

import AmountButton from '@/components/balance/amount-button';
import { starsToNeuron, starsToZeroG } from '@/lib/utils';
import { contractAddress, requiredChain } from '@/lib/web3/config';
import {
	CheckSquareOffsetIcon,
	SpinnerIcon,
	WarningIcon,
} from '@phosphor-icons/react';
import { useInvalidateBalance } from '@/lib/hooks/use-balance';
import { useToast } from '@/components/layout/toast';
import { useState } from 'react';
import {
	useAccount,
	usePublicClient,
	useSendTransaction,
	useSwitchChain,
	useWaitForTransactionReceipt,
} from 'wagmi';

export default function TopupForm() {
	const [amount, setAmount] = useState('');

	const toast = useToast();

	const { address, chainId } = useAccount();
	const publicClient = usePublicClient({ chainId: requiredChain.id });
	const {
		sendTransactionAsync,
		data: txHash,
		isPending: isSending,
	} = useSendTransaction();
	const { isLoading: isConfirming } = useWaitForTransactionReceipt({
		hash: txHash,
		query: { enabled: !!txHash },
	});
	const { switchChainAsync, isPending: isSwitching } = useSwitchChain();

	const invalidateBalance = useInvalidateBalance();

	const stars = parseInt(amount, 10);
	const price = !isNaN(stars) ? starsToZeroG(stars).toString() : '0';
	const loading = isSending || isConfirming || isSwitching;
	const disabled = loading || amount === '' || isNaN(stars) || stars <= 0;
	const wrongChain = !!address && chainId !== requiredChain.id;

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (!contractAddress) {
			toast.error('Contract address not configured.');
			return;
		}
		if (!address) {
			toast.error('No wallet connected.');
			return;
		}
		if (wrongChain) {
			try {
				await switchChainAsync({ chainId: requiredChain.id });
			} catch {
				toast.error(
					`Please switch to ${requiredChain.name} in your wallet.`,
				);
				return;
			}
		}

		const neuronAmount = starsToNeuron(stars);

		let hash: `0x${string}`;
		try {
			hash = await sendTransactionAsync({
				to: contractAddress,
				value: BigInt(neuronAmount),
				chainId: requiredChain.id,
			});
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Transaction rejected.',
			);
			return;
		}

		// Wait for the transaction to be mined before asking the API to verify it
		try {
			if (!publicClient) throw new Error('No RPC client available.');
			await publicClient.waitForTransactionReceipt({ hash });
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: 'Transaction failed on-chain.',
			);
			return;
		}

		const MAX_RETRIES = 3;
		let lastError: Error | null = null;
		for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
			try {
				const res = await fetch('/api/topups', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						walletAddress: address.toLowerCase(),
						chainId: String(requiredChain.id),
						amount: neuronAmount,
						txHash: hash,
					}),
				});
				if (!res.ok) {
					const body = await res.json().catch(() => ({}));
					throw new Error(
						body?.error ?? `Server error ${res.status}`,
					);
				}
				setAmount('');
				invalidateBalance();
				toast.success(
					'Top-up confirmed! Your balance has been updated.',
				);
				return;
			} catch (err) {
				lastError =
					err instanceof Error
						? err
						: new Error('Failed to credit balance.');
				if (attempt < MAX_RETRIES) {
					await new Promise((resolve) =>
						setTimeout(resolve, attempt * 1500),
					);
				}
			}
		}
		toast.error(lastError?.message ?? 'Failed to credit balance.');
	}

	return (
		<form onSubmit={handleSubmit}>
			<div className="grid grid-cols-2 grid-rows-2 mb-5 gap-1">
				<AmountButton
					amount={10000}
					onClick={() => setAmount('10000')}
					disabled={loading}
				/>
				<AmountButton
					amount={100000}
					onClick={() => setAmount('100000')}
					disabled={loading}
				/>
				<AmountButton
					amount={1000000}
					onClick={() => setAmount('1000000')}
					disabled={loading}
				/>
				<AmountButton
					amount={10000000}
					onClick={() => setAmount('10000000')}
					disabled={loading}
				/>
			</div>
			<input
				type="text"
				inputMode="decimal"
				placeholder="Enter amount in stars"
				className="w-full rounded-md border border-neutral-300/50 dark:border-neutral-700/50 bg-white dark:bg-zinc-900 p-2 text-sm text-neutral-900 dark:text-neutral-100 disabled:cursor-not-allowed"
				value={amount}
				onChange={(e) => {
					setAmount(e.target.value);
				}}
				disabled={loading}
			/>
			{wrongChain && (
				<p className="mt-2 flex items-center gap-1 text-xs text-amber-600">
					<WarningIcon
						size={14}
						weight="fill"
					/>
					Wrong network. Will switch to {requiredChain.name} on
					submit.
				</p>
			)}
			<button
				type="submit"
				className="mt-3 w-full rounded-md bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 disabled:bg-rose-300 disabled:cursor-not-allowed"
				disabled={disabled}
			>
				{loading ? (
					<SpinnerIcon
						className="animate-spin mx-auto"
						size={21}
					/>
				) : (
					<>
						Pay {price} <span className="font-mono">0G</span>
					</>
				)}
			</button>
		</form>
	);
}
