'use client';

import { useState } from 'react';
import { ShareNetworkIcon, CheckIcon } from '@phosphor-icons/react';
import { encodeShareId } from '@/lib/share-id';
import { useToast } from '@/components/layout/toast';

interface ShareButtonProps {
	fileId: string;
}

export default function ShareButton({ fileId }: ShareButtonProps) {
	const [copied, setCopied] = useState(false);
	const toast = useToast();

	async function handleShare() {
		const encoded = encodeShareId(fileId);
		const base = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
		const url = `${base}/share/${encoded}`;

		if (navigator.share) {
			try {
				await navigator.share({ url });
				return;
			} catch {
				await navigator.clipboard.writeText(url);
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
				toast.success('Link copied to clipboard.');
			}
		} else {
			await navigator.clipboard.writeText(url);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
			toast.success('Link copied to clipboard.');
		}
	}

	return (
		<button
			onClick={handleShare}
			className="flex items-center gap-4 border border-zinc-300 dark:border-zinc-700 disabled:cursor-not-allowed px-5 py-2 rounded cursor-pointer hover:bg-zinc-50/25 hover:border-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-700/50"
			title="Share file"
		>
			{copied ? <CheckIcon size={16} /> : <ShareNetworkIcon size={16} />}
			{copied ? 'Copied!' : 'Share'}
		</button>
	);
}
