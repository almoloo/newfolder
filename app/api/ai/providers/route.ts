import { auth } from '@/lib/auth/auth';
import { createBroker } from '@/lib/ai/client';

export const dynamic = 'force-dynamic';

// GET — list available inference providers on the 0G compute network.

export async function GET(request: Request) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user?.id) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const broker = await createBroker();
		const services = await broker.inference.listService();

		const providers = services.map((s) => ({
			address: s.provider,
			model: s.model,
			serviceType: s.serviceType,
			url: s.url,
			inputPrice: s.inputPrice.toString(),
			outputPrice: s.outputPrice.toString(),
			verifiability: s.verifiability,
			teeSignerAcknowledged: s.teeSignerAcknowledged,
		}));

		return Response.json({ providers });
	} catch (error) {
		console.error('[ai/providers GET]', error);
		return Response.json(
			{ error: 'Unable to list providers' },
			{ status: 500 },
		);
	}
}
