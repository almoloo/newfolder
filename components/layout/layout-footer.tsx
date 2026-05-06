'use client';

import { CodeIcon } from '@phosphor-icons/react';
import Link from 'next/link';

export default function LayoutFooter() {
	return (
		<footer className="centered-container flex justify-center items-center">
			<p className="text-sm text-gray-500 flex items-center gap-2">
				<CodeIcon
					size={14}
					weight="bold"
				/>
				<small>
					Designed & Developed by{' '}
					<Link
						href="https://github.com/almoloo"
						className="text-rose-600"
						target="_blank"
					>
						almoloo
					</Link>
				</small>
			</p>
		</footer>
	);
}
