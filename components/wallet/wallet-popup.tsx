interface WalletPopupProps {
	type: 'error' | 'info';
	message: string;
}

export default function WalletPopup({ type, message }: WalletPopupProps) {
	return (
		<div
			className={`absolute w-max max-w-xs text-xs mt-1 top-full right-0 border p-2 rounded-lg ${type === 'info' ? 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700' : 'bg-rose-50 dark:bg-rose-900 border-rose-200 dark:border-rose-700 text-rose-600 dark:text-rose-100'}`}
		>
			{message}
		</div>
	);
}
