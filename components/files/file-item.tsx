import {
	FileIcon,
	FileImageIcon,
	FileVideoIcon,
	FileAudioIcon,
	FileTextIcon,
} from '@phosphor-icons/react/dist/ssr';
import type { InferSelectModel } from 'drizzle-orm';
import type { schema } from '@/lib/db';
import {
	getFileCategory,
	isChatSupported,
	timeAgo,
	type FileCategory,
} from '@/lib/utils';
import Link from 'next/link';
import ViewIcon from '@/components/files/view-icon';

type FileRecord = Pick<
	InferSelectModel<typeof schema.file>,
	'id' | 'filename' | 'mimeType' | 'sizeBytes' | 'status' | 'createdAt'
>;

function formatBytes(bytes: string): string {
	const n = Number(bytes);
	if (n === 0) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(n) / Math.log(1024));
	return `${(n / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

const CATEGORY_ICONS: Record<FileCategory, React.ElementType> = {
	image: FileImageIcon,
	video: FileVideoIcon,
	audio: FileAudioIcon,
	document: FileTextIcon,
	other: FileIcon,
};

export default function FileItem({ file }: { file: FileRecord }) {
	const category = getFileCategory(file.mimeType);
	const canChat = isChatSupported(file.mimeType);
	const Icon = CATEGORY_ICONS[category];

	return (
		<Link
			href={`/dashboard/files/${file.id}`}
			className="group flex items-center gap-4 not-first:border-t border-t-neutral-300/50 dark:border-t-neutral-700/50 py-3"
		>
			<div className="bg-white/15 border border-slate-400/20 text-neutral-400 group-hover:bg-rose-300/10 group-hover:border-rose-400/20 group-hover:text-rose-400 aspect-square rounded p-2">
				<Icon
					size={20}
					className="shrink-0"
				/>
			</div>

			<div className="flex flex-col gap-0.5 grow min-w-0">
				<span className="text-sm text-neutral-800 dark:text-neutral-200 truncate">
					{file.filename}
				</span>
				<div className="text-xs text-neutral-500 dark:text-neutral-400">
					<span>{formatBytes(file.sizeBytes)}</span>
					<span> • </span>
					<time
						dateTime={new Date(file.createdAt).toISOString()}
						className="text-xs text-neutral-500 dark:text-neutral-400"
					>
						{timeAgo(file.createdAt)}
					</time>
				</div>
			</div>

			<ViewIcon canChat={canChat} />
			<div className="flex items-center gap-2 shrink-0 text-xs text-neutral-500 dark:text-neutral-400">
				{/* {canChat ? (
					<button className="rounded px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
						Chat
					</button>
				) : (
					<span className="rounded px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed">
						Chat
					</span>
				)} */}
			</div>
		</Link>
	);
}
