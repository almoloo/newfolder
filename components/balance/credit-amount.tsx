'use client';

import { neuronToStars, summarizeAmount } from '@/lib/utils';
import { StarIcon } from '@phosphor-icons/react';

interface CreditAmountProps {
	amount: string;
	size?: 'small' | 'medium' | 'large';
	color?: 'red' | 'green';
}

export default function CreditAmount({
	amount,
	size = 'medium',
	color,
}: CreditAmountProps) {
	// const iconSize = size === 'medium' ? 16 : 24;
	// const textSize = size === 'medium' ? 'text-lg' : 'text-2xl';
	const iconSize = size === 'small' ? 12 : size === 'medium' ? 16 : 24;
	const textSize =
		size === 'small'
			? 'text-sm'
			: size === 'medium'
				? 'text-lg'
				: 'text-2xl';
	const textColor =
		color === 'red'
			? 'text-red-700'
			: color === 'green'
				? 'text-emerald-700'
				: Number(amount) > 0
					? 'text-emerald-700'
					: 'text-red-700';

	return (
		<div className={`flex items-center gap-1 ${textSize} font-medium`}>
			<StarIcon
				weight="duotone"
				size={iconSize}
				className="text-yellow-600"
			/>
			<span className={textColor}>
				{summarizeAmount(neuronToStars(amount))}
			</span>
		</div>
	);
}
