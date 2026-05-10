import { and, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/auth';
import { db, schema } from '@/lib/db';
import { headers } from 'next/headers';
import { redirect, notFound } from 'next/navigation';

import FileMetadata from '@/components/files/file-metadata';
import FileHeader from '@/components/files/file-header';

export const dynamic = 'force-dynamic';

export default async function FilePage({
	params,
}: {
	params: Promise<{ fileId: string }>;
}) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) redirect('/');

	const { fileId } = await params;

	const file = await db.query.file.findFirst({
		where: and(
			eq(schema.file.id, fileId),
			eq(schema.file.ownerId, session.user.id),
		),
	});

	if (!file) notFound();

	return (
		<div>
			<FileHeader file={file} />

			<FileMetadata file={file} />
		</div>
	);
}
