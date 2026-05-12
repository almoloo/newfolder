'use client';

import { useState } from 'react';
import { useToast } from '@/components/layout/toast';
import { DownloadIcon, SpinnerIcon } from '@phosphor-icons/react';

interface DownloadButtonProps {
	fileId: string;
}

export default function DownloadButton({ fileId }: DownloadButtonProps) {
	const [loading, setLoading] = useState(false);
	const toast = useToast();

	async function handleDownload() {
		setLoading(true);
		try {
			const res = await fetch(`/api/files/${fileId}/download`);
			if (!res.ok) {
				let message = `Download failed (${res.status})`;
				try {
					const json = await res.json();
					if (json?.error) message = json.error;
				} catch {}
				toast.error(message);
				return;
			}
			const blob = await res.blob();
			const disposition = res.headers.get('Content-Disposition') ?? '';
			const match = disposition.match(/filename="([^"]+)"/);
			const filename = match?.[1] ?? 'download';
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			a.click();
			URL.revokeObjectURL(url);
			toast.success('File downloaded successfully.');
		} catch (error) {
			console.error(error);
			toast.error('Failed to download file. Please try again.');
		} finally {
			setLoading(false);
		}
	}

	return (
		<button
			onClick={handleDownload}
			disabled={loading}
			className="flex items-center gap-4 border-zinc-800 bg-zinc-800 dark:bg-zinc-500 text-white disabled:cursor-not-allowed px-5 py-2 rounded cursor-pointer hover:bg-zinc-700 disabled:bg-zinc-400"
		>
			{loading ? (
				<SpinnerIcon
					size={16}
					className="animate-spin"
				/>
			) : (
				<DownloadIcon size={16} />
			)}
			{loading ? 'Preparing...' : 'Download'}
		</button>
	);
}
