import type { FileCategory } from '@/lib/utils';
import { getFileCategory } from '@/lib/utils';
import {
	FileIcon,
	FileImageIcon,
	FileVideoIcon,
	FileAudioIcon,
	FileTextIcon,
} from '@phosphor-icons/react/dist/ssr';
import DownloadButton from '@/components/files/download-button';
import ShareButton from '@/components/files/share-button';
import type { FileRecord } from '@/lib/types';

interface FileHeaderProps {
	file: FileRecord;
}

const CATEGORY_ICONS: Record<FileCategory, React.ElementType> = {
	image: FileImageIcon,
	video: FileVideoIcon,
	audio: FileAudioIcon,
	document: FileTextIcon,
	other: FileIcon,
};

export default function FileHeader({ file }: FileHeaderProps) {
	const category = getFileCategory(file.mimeType);
	const Icon = CATEGORY_ICONS[category];

	return (
		<div className="flex items-center flex-wrap gap-4">
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
	);
}
