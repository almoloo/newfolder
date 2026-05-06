'use client';

import { Moon, Sun } from '@phosphor-icons/react';
import { useTheme } from '@/components/providers/theme-provider';

export function ThemeToggle() {
	const { theme, toggleTheme } = useTheme();

	return (
		<button
			onClick={toggleTheme}
			aria-label={
				theme === 'dark'
					? 'Switch to light mode'
					: 'Switch to dark mode'
			}
			className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
		>
			{theme === 'dark' ? (
				<Sun
					size={20}
					weight="bold"
				/>
			) : (
				<Moon
					size={20}
					weight="bold"
				/>
			)}
		</button>
	);
}
