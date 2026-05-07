'use client';

import { neuronToStars } from '@/lib/utils';
import { StarIcon } from '@phosphor-icons/react';

interface CreditAmountProps {
	amount: string;
}

export default function CreditAmount({ amount }: CreditAmountProps) {
	return (
		<div className="flex items-center gap-1 text-lg font-medium">
			<StarIcon
				weight="duotone"
				size={16}
				className="text-yellow-600"
			/>
			<span
				className={`${Number(amount) > 0 ? 'text-emerald-700' : 'text-red-700'}`}
			>
				{neuronToStars(amount)}
			</span>
		</div>
	);
}
