'use client';

import {
	CaretDoubleRightIcon,
	CaretRightIcon,
	ChatsIcon,
} from '@phosphor-icons/react';

interface ViewIconProps {
	canChat?: boolean;
}

export default function ViewIcon({ canChat }: ViewIconProps) {
	return (
		<div className="flex items-center gap-3 shrink-0 text-xs text-neutral-300 dark:text-neutral-400 group-hover:text-neutral-500 transition-colors">
			{canChat && (
				<ChatsIcon
					weight="bold"
					size={14}
				/>
			)}
			<CaretRightIcon
				weight="bold"
				size={14}
				className="group-hover:hidden"
			/>
			<CaretDoubleRightIcon
				weight="bold"
				size={14}
				className="hidden group-hover:block"
			/>
		</div>
	);
}
