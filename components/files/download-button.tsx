'use client';

import { useState } from 'react';
import { useToast } from '@/components/layout/toast';

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
			if (!res.ok) throw new Error('Download failed');
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
			className="ml-auto px-3 py-1 text-sm bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{loading ? 'Preparing...' : 'Download'}
		</button>
	);
}
