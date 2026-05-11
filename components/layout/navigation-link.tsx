'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavigationLink({
	href,
	title,
	icon,
}: {
	href: string;
	title?: string;
	icon?: React.ReactNode;
}) {
	const pathname = usePathname();
	const isActive = pathname === href;

	return (
		<Link
			href={href}
			className={`flex items-center font-medium gap-2 py-3 pl-4 pr-5 border-b-3 ${isActive ? 'border-b-rose-500 text-rose-500 dark:text-rose-400 dark:border-b-rose-400' : 'border-b-neutral-300/50 hover:border-b-neutral-300/90 hover:bg-neutral-100/75 dark:hover:bg-neutral-100/10 active:border-b-neutral-500/25 active:bg-neutral-300/50'}`}
		>
			{icon && <span>{icon}</span>}
			{title}
		</Link>
	);
}
