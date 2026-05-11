'use client';

import { useBalance } from '@/lib/hooks/use-balance';
import CreditAmount from '@/components/balance/credit-amount';
import { SpinnerIcon } from '@phosphor-icons/react';

export default function TabBalance() {
	const { data, isLoading } = useBalance();

	return (
		<div className="text-sm font-medium py-3 px-3 border-b-3 border-b-neutral-300/50">
			{isLoading || !data ? (
				<span className="text-neutral-400 text-xs">
					<SpinnerIcon
						className="animate-spin"
						size={16}
					/>
				</span>
			) : (
				<CreditAmount
					amount={data.availableAmount}
					size="small"
				/>
			)}
		</div>
	);
}
