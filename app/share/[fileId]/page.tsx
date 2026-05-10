import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import {
	FileIcon,
	FileImageIcon,
	FileVideoIcon,
	FileAudioIcon,
	FileTextIcon,
} from '@phosphor-icons/react/dist/ssr';
import { db, schema } from '@/lib/db';
import { decodeShareId } from '@/lib/share-id';
import { getFileCategory, type FileCategory } from '@/lib/utils';
import ShareButton from '@/components/files/share-button';
import DownloadButton from '@/components/files/download-button';

const CATEGORY_ICONS: Record<FileCategory, React.ElementType> = {
	image: FileImageIcon,
	video: FileVideoIcon,
	audio: FileAudioIcon,
	document: FileTextIcon,
	other: FileIcon,
};

function formatBytes(bytes: string): string {
	const n = Number(bytes);
	if (n === 0) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(n) / Math.log(1024));
	return `${(n / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
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

export default async function ShareFile({
	params,
}: {
	params: Promise<{ fileId: string }>;
}) {
	const { fileId } = await params;

	let uuid: string;
	try {
		uuid = decodeShareId(fileId);
	} catch {
		notFound();
	}

	const file = await db.query.file.findFirst({
		where: eq(schema.file.id, uuid),
		columns: {
			id: true,
			storageHash: true,
			filename: true,
			mimeType: true,
			sizeBytes: true,
			createdAt: true,
		},
	});

	if (!file) {
		notFound();
	}

	const category = getFileCategory(file.mimeType);
	const Icon = CATEGORY_ICONS[category];

	return (
		<div className="">
			<div className="flex items-center flex-wrap gap-4 mb-5 md:mb-8">
				<div className="bg-white/15 border border-slate-400/20 text-neutral-400 aspect-square rounded p-3">
					<Icon size={28} />
				</div>
				<div className="min-w-0 grow">
					<h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 truncate">
						{file.filename}
					</h1>
					<p className="text-sm text-neutral-500 mt-0.5">
						{file.mimeType ?? 'Unknown type'}
					</p>
				</div>
				<div className="grid grid-cols-2 md:flex gap-2 ml-auto w-full md:w-auto">
					<ShareButton fileId={file.id} />
					<DownloadButton fileId={file.id} />
				</div>
			</div>

			<dl className="divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
				<Row label="Size">{formatBytes(file.sizeBytes)}</Row>
				<Row label="Storage Hash">
					<span className="font-mono text-xs break-all">
						{file.storageHash}
					</span>
				</Row>
				<Row label="Uploaded">
					<time dateTime={new Date(file.createdAt).toISOString()}>
						{new Date(file.createdAt).toLocaleString(undefined, {
							dateStyle: 'medium',
							timeStyle: 'short',
						})}
					</time>
				</Row>
			</dl>
		</div>
	);
}
