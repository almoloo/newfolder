'use client';

import { neuronToStars, summarizeAmount } from '@/lib/utils';
import { StarIcon } from '@phosphor-icons/react';

interface CreditAmountProps {
	amount: string;
	size?: 'small' | 'large';
}

export default function CreditAmount({
	amount,
	size = 'small',
}: CreditAmountProps) {
	const iconSize = size === 'small' ? 16 : 24;
	const textSize = size === 'small' ? 'text-lg' : 'text-2xl';

	return (
		<div className={`flex items-center gap-1 ${textSize} font-medium`}>
			<StarIcon
				weight="duotone"
				size={iconSize}
				className="text-yellow-600"
			/>
			<span
				className={`${Number(amount) > 0 ? 'text-emerald-700' : 'text-red-700'}`}
			>
				{summarizeAmount(neuronToStars(amount))}
			</span>
		</div>
	);
}
