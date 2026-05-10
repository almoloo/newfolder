'use client';

import { FileIcon } from '@phosphor-icons/react';

export default function NavigationFile({ title }: { title: string }) {
	return (
		<div className="flex items-center gap-2 py-3 pl-4 pr-5 border-b-3 border-b-rose-500 text-rose-500 dark:text-rose-400 dark:border-b-rose-400 min-w-0 max-w-48">
			<span className="shrink-0">
				<FileIcon
					weight="duotone"
					size={20}
				/>
			</span>
			<span className="truncate">{title}</span>
		</div>
	);
}
