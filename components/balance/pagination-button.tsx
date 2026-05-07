'use client';

import { ArrowLeftIcon, ArrowRightIcon } from '@phosphor-icons/react';
import Link from 'next/link';

interface PaginationButtonProps {
	type: 'previous' | 'next';
	disabled?: boolean;
	href: string;
}

export default function PaginationButton({
	type,
	href,
}: PaginationButtonProps) {
	return (
		<Link
			href={href}
			className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
		>
			{type === 'previous' ? (
				<>
					<ArrowLeftIcon size={16} />
					<span>Previous</span>
				</>
			) : (
				<>
					<ArrowRightIcon size={16} />
					<span>Next</span>
				</>
			)}
		</Link>
	);
}
