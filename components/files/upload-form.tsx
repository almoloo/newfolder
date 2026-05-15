'use client';

import { useBalance, useInvalidateBalance } from '@/lib/hooks/use-balance';
import { useToast } from '@/components/layout/toast';
import { neuronToStars, summarizeAmount } from '@/lib/utils';
import {
	CloudArrowUpIcon,
	FileIcon,
	SpinnerIcon,
	WarningIcon,
} from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100 MB
const FEE_PER_BYTE = BigInt(process.env.NEXT_PUBLIC_UPLOAD_FEE_PER_BYTE ?? '0');
const NEURON_PER_STAR = BigInt('1000000000000');
const MINIMUM_FEE_STARS = 2500n; // Minimum 2,500 stars to cover gas costs

function fileCost(sizeBytes: number): bigint {
	if (FEE_PER_BYTE === 0n) return 0n;
	const neuron = FEE_PER_BYTE * BigInt(sizeBytes);
	// Round up to the nearest whole star
	const stars = (neuron + NEURON_PER_STAR - 1n) / NEURON_PER_STAR;
	// Apply minimum fee of 2,500 stars to cover gas costs
	const finalStars = stars > MINIMUM_FEE_STARS ? stars : MINIMUM_FEE_STARS;
	return finalStars * NEURON_PER_STAR;
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function UploadForm() {
	const [file, setFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);

	const toast = useToast();

	const { data: balanceData } = useBalance();
	const invalidateBalance = useInvalidateBalance();
	const router = useRouter();

	const availableNeuron = BigInt(balanceData?.availableAmount ?? '0');
	const cost = file ? fileCost(file.size) : 0n;
	const costStars = file ? Number(cost / NEURON_PER_STAR) : 0;
	const hasEnough = cost === 0n || availableNeuron >= cost;

	const onDrop = useCallback((accepted: File[]) => {
		setFile(accepted[0] ?? null);
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		multiple: false,
		maxSize: MAX_FILE_BYTES,
		disabled: uploading,
		onDropRejected: (rejections) => {
			const reason = rejections[0]?.errors[0]?.message ?? 'File rejected';
			toast.error(reason);
		},
	});

	async function handleUpload(e: React.FormEvent) {
		e.preventDefault();
		if (!file) return;

		setUploading(true);

		try {
			const form = new FormData();
			form.append('file', file);

			const res = await fetch('/api/files', {
				method: 'POST',
				body: form,
			});
			const json = await res.json();

			if (!res.ok) {
				toast.error(json?.error ?? `Upload failed (${res.status})`);
				return;
			}

			setFile(null);
			invalidateBalance();
			router.refresh();
			toast.success('File uploaded successfully!');
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Upload failed');
		} finally {
			setUploading(false);
		}
	}

	return (
		<form onSubmit={handleUpload}>
			{/* Drop zone */}
			<div
				{...getRootProps()}
				className={`mt-1 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 transition-colors ${uploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${
					isDragActive
						? 'border-rose-400 bg-rose-50 dark:bg-rose-950/20'
						: 'border-neutral-300/60 dark:border-neutral-700/60 hover:border-rose-300 dark:hover:border-rose-900'
				}`}
			>
				<input {...getInputProps()} />
				{file ? (
					<>
						<FileIcon
							size={28}
							weight="duotone"
							className="text-neutral-400"
						/>
						<p className="text-sm font-medium text-neutral-700 dark:text-neutral-200 text-center break-all">
							{file.name}
						</p>
						<p className="text-xs text-neutral-400">
							{formatBytes(file.size)}
							{cost > 0n && (
								<>
									{' · '}
									<span
										className={
											hasEnough
												? 'text-neutral-400'
												: 'text-red-500'
										}
									>
										{summarizeAmount(costStars)} star
										{summarizeAmount(costStars) === '1'
											? ''
											: 's'}
									</span>
								</>
							)}
						</p>
					</>
				) : (
					<>
						<CloudArrowUpIcon
							size={28}
							weight="duotone"
							className="text-neutral-400"
						/>
						<p className="text-sm text-neutral-500">
							{isDragActive
								? 'Drop it here'
								: 'Drag & drop or click to browse'}
						</p>
						<p className="text-xs text-neutral-400">Max 100 MB</p>
					</>
				)}
			</div>

			{!hasEnough && file && (
				<p className="mt-2 flex items-center gap-2 text-xs text-amber-600">
					<WarningIcon
						size={14}
						weight="fill"
					/>
					Insufficient balance — top up at least{' '}
					{summarizeAmount(
						costStars -
							neuronToStars(balanceData?.availableAmount ?? '0'),
					)}{' '}
					more stars.
				</p>
			)}

			<button
				type="submit"
				disabled={!file || uploading || !hasEnough}
				className="mt-3 w-full rounded-md bg-rose-500 dark:bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 dark:hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed dark:disabled:bg-rose-800/30 dark:disabled:text-rose-300/50 cursor-pointer"
			>
				{uploading ? (
					<SpinnerIcon
						className="animate-spin mx-auto"
						size={21}
					/>
				) : (
					'Upload'
				)}
			</button>
		</form>
	);
}
