import { and, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/auth';
import { db, schema } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Returns the status of a specific credit purchase so the UI can poll until it moves from pending to credited.

class BadRequestError extends Error {}

function parseTopupId(id: string) {
	const value = id.trim();

	if (!value) {
		throw new BadRequestError('id is required');
	}

	return value;
}

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
		const topupId = parseTopupId(id);

		const topup = await db.query.topup.findFirst({
			where: and(
				eq(schema.topup.id, topupId),
				eq(schema.topup.userId, session.user.id),
			),
			columns: {
				id: true,
				walletAddress: true,
				chainId: true,
				amount: true,
				txHash: true,
				status: true,
				blockNumber: true,
				confirmedAt: true,
				creditedAt: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		if (!topup) {
			return Response.json({ error: 'Topup not found' }, { status: 404 });
		}

		return Response.json(topup, { status: 200 });
	} catch (error) {
		if (error instanceof BadRequestError) {
			return Response.json({ error: error.message }, { status: 400 });
		}

		return Response.json(
			{ error: 'Unable to load topup' },
			{ status: 500 },
		);
	}
}
