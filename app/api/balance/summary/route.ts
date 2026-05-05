import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/auth';
import { db, schema } from '@/lib/db';
import type { CreditBalanceSnapshot } from '@/lib/types/credits';

export const dynamic = 'force-dynamic';

// Returns the authenticated user’s credit snapshot for the header/cards: available, locked, total credited, total debited. This is the main balance endpoint.

const emptySnapshot: CreditBalanceSnapshot = {
	availableAmount: '0',
	lockedAmount: '0',
	totalCredited: '0',
	totalDebited: '0',
};

export async function GET(request: Request) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user?.id) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const balance = await db.query.creditBalance.findFirst({
			where: eq(schema.creditBalance.userId, session.user.id),
			columns: {
				availableAmount: true,
				lockedAmount: true,
				totalCredited: true,
				totalDebited: true,
			},
		});

		return Response.json(balance ?? emptySnapshot, { status: 200 });
	} catch {
		return Response.json(
			{ error: 'Unable to load balance summary' },
			{ status: 500 },
		);
	}
}
