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

		let downloadErr: unknown = null;
		for (let attempt = 1; attempt <= 3; attempt++) {
			// Fresh temp path each attempt so the SDK cannot reuse a stale/corrupted file
			const attemptPath = path.join(
				os.tmpdir(),
				`zg-dl-${crypto.randomUUID()}`,
			);
			tempPath = attemptPath;
			try {
				const indexer = createIndexer();
				const err = await indexer.download(
					storageKey,
					attemptPath,
					false,
				);
				if (err !== null) {
					downloadErr = err;
					console.warn(
						`[files/[id]/download] attempt ${attempt} error:`,
						err,
					);
					await fs.unlink(attemptPath).catch(() => {});
					continue;
				}
				// Verify file is not empty or zero-filled (corrupted node response)
				const stat = await fs.stat(attemptPath).catch(() => null);
				if (!stat || stat.size === 0) {
					downloadErr = new Error('Downloaded file is empty');
					console.warn(
						`[files/[id]/download] attempt ${attempt}: file is empty`,
					);
					await fs.unlink(attemptPath).catch(() => {});
					continue;
				}
				const handle = await fs.open(attemptPath, 'r');
				const header = Buffer.alloc(4);
				await handle.read(header, 0, 4, 0);
				await handle.close();
				if (header.readUInt32BE(0) === 0) {
					downloadErr = new Error(
						'Downloaded file has zero-filled header (corrupted)',
					);
					console.warn(
						`[files/[id]/download] attempt ${attempt}: file header is zero-filled`,
					);
					await fs.unlink(attemptPath).catch(() => {});
					continue;
				}
				downloadErr = null;
				break;
			} catch (e) {
				downloadErr = e;
				console.warn(
					`[files/[id]/download] attempt ${attempt} threw:`,
					(e as Error).message ?? e,
				);
				await fs.unlink(attemptPath).catch(() => {});
			}
		}

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
