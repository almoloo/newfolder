import { auth } from '@/lib/auth/auth';

// Returns the fixed chat price in stars per 100 characters.
// 1 star = 10^15 neuron. 1 A0GI = 1000 stars.
// Configured via CHAT_PRICE_PER_100_CHARS env var.

export async function GET(request: Request) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});
		if (!session?.user?.id) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const pricePerHundredChars =
			process.env.CHAT_PRICE_PER_100_CHARS ?? '1';

		return Response.json({ pricePerHundredChars });
	} catch (error) {
		console.error('[ai/pricing GET]', error);
		return Response.json(
			{ error: 'Unable to fetch pricing' },
			{ status: 500 },
		);
	}
}
