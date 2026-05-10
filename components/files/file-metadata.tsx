import type { FileRecord } from '@/lib/types';

interface FileMetadataProps {
	file: FileRecord;
	isCompact?: boolean;
}

function Row({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex justify-between gap-4 px-4 py-3 text-sm bg-white/5">
			<dt className="text-neutral-500 shrink-0">{label}</dt>
			<dd className="text-neutral-900 dark:text-neutral-100 text-right">
				{children}
			</dd>
		</div>
	);
}

function formatBytes(bytes: string): string {
	const n = Number(bytes);
	if (n === 0) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(n) / Math.log(1024));
	return `${(n / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function FileMetadata({ file, isCompact }: FileMetadataProps) {
	return (
		<dl className="divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
			{!isCompact && (
				<Row label="Status">
					<span className="capitalize">{file.status}</span>
				</Row>
			)}
			<Row label="Size">{formatBytes(file.sizeBytes)}</Row>
			<Row label="Storage Hash">
				<span className="font-mono text-xs break-all">
					{file.storageHash}
				</span>
			</Row>
			{!isCompact && (
				<Row label="File ID">
					<span className="font-mono text-xs">{file.id}</span>
				</Row>
			)}
			<Row label="Uploaded">
				{
					<time dateTime={new Date(file.createdAt).toISOString()}>
						{new Date(file.createdAt).toLocaleString(undefined, {
							dateStyle: 'medium',
							timeStyle: 'short',
						})}
					</time>
				}
			</Row>
		</dl>
	);
}
