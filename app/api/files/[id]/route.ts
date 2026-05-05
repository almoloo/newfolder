import { and, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/auth';
import { db, schema } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET  — fetch metadata for a single file owned by the authenticated user.
// DELETE — remove the DB record (0G data is immutable on-chain).

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
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
				id: true,
				storageHash: true,
				filename: true,
				mimeType: true,
				sizeBytes: true,
				quotedFee: true,
				chargedFee: true,
				status: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		if (!file) {
			return Response.json({ error: 'File not found' }, { status: 404 });
		}

		return Response.json(file);
	} catch (error) {
		console.error('[files/[id] GET]', error);
		return Response.json(
			{ error: 'Unable to retrieve file' },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user?.id) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id } = await params;

		const [deleted] = await db
			.delete(schema.file)
			.where(
				and(
					eq(schema.file.id, id),
					eq(schema.file.ownerId, session.user.id),
				),
			)
			.returning({ id: schema.file.id });

		if (!deleted) {
			return Response.json({ error: 'File not found' }, { status: 404 });
		}

		// Note: 0G storage data is immutable and cannot be deleted on-chain.
		// Only the local DB record is removed here.

		return new Response(null, { status: 204 });
	} catch (error) {
		console.error('[files/[id] DELETE]', error);
		return Response.json(
			{ error: 'Unable to delete file record' },
			{ status: 500 },
		);
	}
}
