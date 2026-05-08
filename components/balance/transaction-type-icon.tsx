'use client';

import type { CreditTransactionHistoryItem } from '@/lib/types';
import { ArrowDownRightIcon, ArrowUpRightIcon } from '@phosphor-icons/react';

interface TxTypeIconProps {
	type: CreditTransactionHistoryItem['type'];
}

export default function TxTypeIcon({ type }: TxTypeIconProps) {
	const isIncoming =
		type === 'adjustment' ||
		type === 'topup' ||
		type === 'refund' ||
		type === 'topup_credit';

	return (
		<div
			className={`aspect-square rounded-full p-3 shrink-0 ${isIncoming ? 'bg-emerald-700/10 text-emerald-700 dark:text-emerald-500' : 'bg-rose-700/10 text-rose-700 dark:text-rose-500'}`}
		>
			{isIncoming ? (
				<ArrowDownRightIcon
					weight="bold"
					size={24}
				/>
			) : (
				<ArrowUpRightIcon
					weight="bold"
					size={24}
				/>
			)}
		</div>
	);
}
