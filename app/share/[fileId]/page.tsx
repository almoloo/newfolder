import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import { decodeShareId } from '@/lib/share-id';
import FileMetadata from '@/components/files/file-metadata';
import FileHeader from '@/components/files/file-header';

async function getFile(fileId: string) {
	let uuid: string;
	try {
		uuid = decodeShareId(fileId);
	} catch {
		return null;
	}
	return db.query.file.findFirst({
		where: eq(schema.file.id, uuid),
		columns: {
			id: true,
			storageHash: true,
			filename: true,
			mimeType: true,
			sizeBytes: true,
			createdAt: true,
			status: true,
		},
	});
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ fileId: string }>;
}): Promise<Metadata> {
	const { fileId } = await params;
	const file = await getFile(fileId);
	if (!file) return {};

	const title = file.filename;
	const description = `View and chat with "${file.filename}" on NewFolder — decentralized AI-powered file storage.`;

	return {
		title,
		description,
		openGraph: {
			type: 'article',
			title,
			description,
		},
		twitter: {
			card: 'summary',
			title,
			description,
		},
	};
}

export default async function ShareFile({
	params,
}: {
	params: Promise<{ fileId: string }>;
}) {
	const { fileId } = await params;
	const file = await getFile(fileId);

	if (!file) {
		notFound();
	}

	return (
		<div className="flex flex-col gap-5">
			<FileHeader file={file} />

			<FileMetadata
				file={file}
				isCompact
			/>
		</div>
	);
}
