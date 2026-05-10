import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import { decodeShareId } from '@/lib/share-id';
import FileMetadata from '@/components/files/file-metadata';
import FileHeader from '@/components/files/file-header';

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
			status: true,
		},
	});

	if (!file) {
		notFound();
	}

	return (
		<div>
			<FileHeader file={file} />

			<FileMetadata
				file={file}
				isCompact
			/>
		</div>
	);
}
