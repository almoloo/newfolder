'use client';

import { HeartBreakIcon } from '@phosphor-icons/react';

interface EmptyStateProps {
	title: string;
	description: string;
	icon: 'heartbreak';
}

export default function EmptyState({
	title,
	description,
	icon,
}: EmptyStateProps) {
	return (
		<div className="flex items-center gap-5 text-sm text-neutral-600 bg-linear-to-r from-white/50 to-white/0 dark:from-zinc-900/50 dark:to-zinc-900/0 border-l-8 border-l-white dark:border-l-zinc-900 px-5 py-5 my-10">
			<div className="text-slate-700">
				{icon === 'heartbreak' && (
					<HeartBreakIcon
						weight="duotone"
						size={48}
					/>
				)}
			</div>
			<div className="flex flex-col items-start gap-1 text-slate-500">
				<strong>{title}</strong>
				<span>{description}</span>
			</div>
		</div>
	);
}
