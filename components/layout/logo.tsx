'use client';

import Link from 'next/link';
import { FolderPlusIcon } from '@phosphor-icons/react';

export default function Logo() {
	return (
		<Link
			href="/"
			className="flex items-end gap-1"
		>
			<span className="text-rose-400">
				<FolderPlusIcon
					size={32}
					weight="fill"
				/>
			</span>
			<h1 className="text-lg font-black text-zinc-800 dark:text-zinc-300">
				NewFolder
			</h1>
		</Link>
	);
}
