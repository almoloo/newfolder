import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/auth';
import { db, schema } from '@/lib/db';
import { createIndexer, decodeStorageHash } from '@/lib/storage/client';

export const dynamic = 'force-dynamic';

// GET — download a file from 0G storage.
// The SDK writes to a file path, so we use a temp file then stream it back.

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	let tempPath: string | null = null;

	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user?.id) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = await params;

		const file = await db.query.file.findFirst({
			where: and(
				eq(schema.file.id, id),
				eq(schema.file.ownerId, session.user.id),
			),
			columns: {
				storageHash: true,
				filename: true,
				mimeType: true,
			},
		});

		if (!file) {
			return Response.json({ error: 'File not found' }, { status: 404 });
		}

		const storageKey = decodeStorageHash(file.storageHash);
		tempPath = path.join(os.tmpdir(), `zg-dl-${crypto.randomUUID()}`);

		const indexer = createIndexer();
		const downloadErr = await indexer.download(storageKey, tempPath, false);

		if (downloadErr !== null) {
			console.error(
				'[files/[id]/download] 0G download error:',
				downloadErr,
			);
			return Response.json(
				{ error: 'Failed to retrieve file from storage network' },
				{ status: 502 },
			);
		}

		const data = await fs.readFile(tempPath);

		// Sanitize filename for Content-Disposition header
		const safeFilename = file.filename.replace(/["\\]/g, '_');

		return new Response(data, {
			status: 200,
			headers: {
				'Content-Type': file.mimeType ?? 'application/octet-stream',
				'Content-Disposition': `attachment; filename="${safeFilename}"`,
				'Content-Length': String(data.byteLength),
			},
		});
	} catch (error) {
		console.error('[files/[id]/download GET]', error);
		return Response.json(
			{ error: 'Unable to download file' },
			{ status: 500 },
		);
	} finally {
		if (tempPath !== null) {
			await fs.unlink(tempPath).catch(() => {
				// Silently ignore cleanup failures
			});
		}
	}
}
