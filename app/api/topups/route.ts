import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/auth';
import { db, schema } from '@/lib/db';
import {
	topupStatuses,
	type TopupRecordInput,
	type TopupStatus,
} from '@/lib/types/credits';
import { requiredChain } from '@/lib/web3/config';

// Creates or registers a credit purchase attempt. Use this for the “buy credits” flow, not for generic wallet funding.

class BadRequestError extends Error {}

const txHashPattern = /^0x[a-fA-F0-9]{64}$/;
const walletAddressPattern = /^0x[a-fA-F0-9]{40}$/;
const integerStringPattern = /^(0|[1-9][0-9]*)$/;

function parseBody(body: unknown): TopupRecordInput {
	if (!body || typeof body !== 'object' || Array.isArray(body)) {
		throw new BadRequestError('Request body must be a JSON object');
	}

	const candidate = body as Record<string, unknown>;
	const walletAddress =
		typeof candidate.walletAddress === 'string'
			? candidate.walletAddress.trim()
			: '';
	const chainIdValue = candidate.chainId;
	const amount =
		typeof candidate.amount === 'string' ? candidate.amount.trim() : '';
	const txHash =
		typeof candidate.txHash === 'string' ? candidate.txHash.trim() : '';
	const status = candidate.status;
	const blockNumber = candidate.blockNumber;

	if (!walletAddressPattern.test(walletAddress)) {
		throw new BadRequestError('walletAddress must be a valid EVM address');
	}

	const chainId =
		typeof chainIdValue === 'number'
			? String(chainIdValue)
			: typeof chainIdValue === 'string'
				? chainIdValue.trim()
				: '';

	if (!integerStringPattern.test(chainId)) {
		throw new BadRequestError('chainId must be a positive integer string');
	}

	if (!integerStringPattern.test(amount) || amount === '0') {
		throw new BadRequestError('amount must be a positive integer string');
	}

	if (!txHashPattern.test(txHash)) {
		throw new BadRequestError('txHash must be a valid transaction hash');
	}

	if (
		status !== undefined &&
		!topupStatuses.includes(status as TopupStatus)
	) {
		throw new BadRequestError(`Invalid status: ${String(status)}`);
	}

	if (
		blockNumber !== undefined &&
		blockNumber !== null &&
		(typeof blockNumber !== 'string' ||
			!integerStringPattern.test(blockNumber.trim()))
	) {
		throw new BadRequestError('blockNumber must be an integer string');
	}

	return {
		walletAddress,
		chainId,
		amount,
		txHash,
		status: status as TopupStatus | undefined,
		blockNumber:
			typeof blockNumber === 'string' ? blockNumber.trim() : undefined,
	};
}

function isUniqueViolation(error: unknown) {
	return (
		typeof error === 'object' &&
		error !== null &&
		'code' in error &&
		error.code === '23505'
	);
}

export async function POST(request: Request) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user?.id) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const payload = parseBody(await request.json());
		const user = await db.query.user.findFirst({
			where: eq(schema.user.id, session.user.id),
			columns: {
				walletAddress: true,
			},
		});

		if (!user?.walletAddress) {
			return Response.json(
				{ error: 'Authenticated user does not have a linked wallet' },
				{ status: 403 },
			);
		}

		if (
			user.walletAddress.toLowerCase() !==
			payload.walletAddress.toLowerCase()
		) {
			return Response.json(
				{
					error: 'walletAddress does not match the authenticated user',
				},
				{ status: 403 },
			);
		}

		if (payload.chainId !== String(requiredChain.id)) {
			return Response.json(
				{ error: `Unsupported chainId: ${payload.chainId}` },
				{ status: 400 },
			);
		}

		const status = payload.status ?? 'pending';
		const now = new Date();

		const [createdTopup] = await db
			.insert(schema.topup)
			.values({
				userId: session.user.id,
				walletAddress: payload.walletAddress,
				chainId: payload.chainId,
				amount: payload.amount,
				txHash: payload.txHash,
				status,
				blockNumber: payload.blockNumber ?? null,
				confirmedAt:
					status === 'confirmed' || status === 'credited'
						? now
						: null,
				creditedAt: status === 'credited' ? now : null,
			})
			.returning({
				id: schema.topup.id,
				walletAddress: schema.topup.walletAddress,
				chainId: schema.topup.chainId,
				amount: schema.topup.amount,
				txHash: schema.topup.txHash,
				status: schema.topup.status,
				blockNumber: schema.topup.blockNumber,
				confirmedAt: schema.topup.confirmedAt,
				creditedAt: schema.topup.creditedAt,
				createdAt: schema.topup.createdAt,
				updatedAt: schema.topup.updatedAt,
			});

		return Response.json(createdTopup, { status: 201 });
	} catch (error) {
		if (error instanceof BadRequestError) {
			return Response.json({ error: error.message }, { status: 400 });
		}

		if (isUniqueViolation(error)) {
			return Response.json(
				{ error: 'A topup with this txHash already exists' },
				{ status: 409 },
			);
		}

		return Response.json(
			{ error: 'Unable to create topup' },
			{ status: 500 },
		);
	}
}
