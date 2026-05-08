'use client';

import { starsToZeroG, summarizeAmount } from '@/lib/utils';
import { StarIcon } from '@phosphor-icons/react';

interface AmountButtonProps {
	amount: number;
	onClick?: () => void;
	disabled?: boolean;
}

export default function AmountButton({
	amount,
	onClick,
	disabled,
}: AmountButtonProps) {
	const price = starsToZeroG(amount);
	return (
		<button
			className="flex flex-col border border-neutral-200 dark:border-neutral-600 hover:border-neutral-300 hover:bg-white/30 dark:hover:border-neutral-500 dark:hover:bg-white/10 active:border-neutral-400 active:bg-white/50 dark:active:border-neutral-400 dark:active:bg-white/20 rounded-lg cursor-pointer p-2 transition-colors disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-transparent disabled:text-neutral-400"
			type="button"
			disabled={disabled}
			onClick={onClick}
		>
			<div className="flex items-center justify-center gap-1">
				<StarIcon size={16} />
				<span>{summarizeAmount(amount)}</span>
			</div>
			<div className="flex justify-center items-center gap-1">
				<span className="text-xs text-neutral-500">{price}</span>
				<span className="text-xs font-mono text-neutral-500">0G</span>
			</div>
		</button>
	);
}
