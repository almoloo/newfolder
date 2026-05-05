import { and, eq, sql } from 'drizzle-orm';
import { createPublicClient, http, parseAbi } from 'viem';
import { auth } from '@/lib/auth/auth';
import { db, schema } from '@/lib/db';
import {
	topupStatuses,
	type TopupRecordInput,
	type TopupStatus,
} from '@/lib/types/credits';
import { requiredChain, contractAddress } from '@/lib/web3/chains';
import { depositFundToComputeLedger } from '@/lib/ai/client';

export const dynamic = 'force-dynamic';

const VAULT_ABI = parseAbi([
	'event BalanceToppedUp(address indexed account, uint256 amount, uint256 newAccountTotal)',
]);

/**
 * Verify a topup transaction on-chain.
 * Throws a descriptive error string if verification fails.
 */
async function verifyTopupTx(
	txHash: `0x${string}`,
	fromAddress: string,
	claimedAmount: string,
): Promise<void> {
	if (!contractAddress) {
		throw new Error('Contract address not configured on server');
	}

	const client = createPublicClient({
		chain: requiredChain,
		transport: http(requiredChain.rpcUrls.default.http[0]),
	});

	const receipt = await client.getTransactionReceipt({ hash: txHash });

	if (!receipt) {
		throw new Error('Transaction not found on-chain');
	}

	if (receipt.status !== 'success') {
		throw new Error('Transaction reverted on-chain');
	}

	if (receipt.to?.toLowerCase() !== contractAddress.toLowerCase()) {
		throw new Error('Transaction target is not the CreditVault contract');
	}

	// Use viem's parseEventLogs to decode BalanceToppedUp events from the receipt
	const { parseEventLogs } = await import('viem');
	const events = parseEventLogs({
		abi: VAULT_ABI,
		logs: receipt.logs,
	});

	const matchingEvent = events.find(
		(e) =>
			e.eventName === 'BalanceToppedUp' &&
			e.args.account.toLowerCase() === fromAddress.toLowerCase() &&
			e.args.amount === BigInt(claimedAmount),
	);

	if (!matchingEvent) {
		throw new Error(
			'No matching BalanceToppedUp event found for this wallet and amount',
		);
	}
}

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
			? candidate.walletAddress.trim().toLowerCase()
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

		// Better Auth SIWE stores wallet addresses in the walletAddress model using
		// EIP-55 checksum format — compare case-insensitively via lower().
		const linkedWallet = await db.query.walletAddress.findFirst({
			where: and(
				eq(schema.walletAddress.userId, session.user.id),
				sql`lower(${schema.walletAddress.address}) = ${payload.walletAddress}`,
			),
			columns: { address: true },
		});

		if (!linkedWallet) {
			return Response.json(
				{ error: 'Authenticated user does not have a linked wallet' },
				{ status: 403 },
			);
		}

		if (payload.chainId !== String(requiredChain.id)) {
			return Response.json(
				{ error: `Unsupported chainId: ${payload.chainId}` },
				{ status: 400 },
			);
		}

		// Verify the transaction on-chain before crediting anything
		try {
			await verifyTopupTx(
				payload.txHash as `0x${string}`,
				payload.walletAddress,
				payload.amount,
			);
		} catch (err) {
			return Response.json(
				{
					error: `On-chain verification failed: ${err instanceof Error ? err.message : String(err)}`,
				},
				{ status: 422 },
			);
		}

		const now = new Date();
		const userId = session.user.id;

		const createdTopup = await db.transaction(async (tx) => {
			// 1. Insert topup as immediately credited
			const [topup] = await tx
				.insert(schema.topup)
				.values({
					userId,
					walletAddress: payload.walletAddress,
					chainId: payload.chainId,
					amount: payload.amount,
					txHash: payload.txHash,
					status: 'credited',
					blockNumber: payload.blockNumber ?? null,
					confirmedAt: now,
					creditedAt: now,
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

			// 2. Upsert credit_balance — create on first topup, increment on subsequent
			const existing = await tx.query.creditBalance.findFirst({
				where: eq(schema.creditBalance.userId, userId),
				columns: {
					id: true,
					availableAmount: true,
					totalCredited: true,
				},
			});

			let balanceId: string;
			let balanceBefore: string;
			let balanceAfter: string;

			if (existing) {
				balanceBefore = existing.availableAmount;
				balanceAfter = String(
					BigInt(existing.availableAmount) + BigInt(payload.amount),
				);
				await tx
					.update(schema.creditBalance)
					.set({
						availableAmount: balanceAfter,
						totalCredited: String(
							BigInt(existing.totalCredited) +
								BigInt(payload.amount),
						),
						updatedAt: now,
					})
					.where(eq(schema.creditBalance.id, existing.id));
				balanceId = existing.id;
			} else {
				balanceBefore = '0';
				balanceAfter = payload.amount;
				const [created] = await tx
					.insert(schema.creditBalance)
					.values({
						userId,
						availableAmount: payload.amount,
						totalCredited: payload.amount,
					})
					.returning({ id: schema.creditBalance.id });
				balanceId = created.id;
			}

			// 3. Insert credit_transaction ledger entry
			await tx.insert(schema.creditTransaction).values({
				userId,
				balanceId,
				type: 'topup_credit',
				status: 'confirmed',
				amount: payload.amount,
				balanceBefore,
				balanceAfter,
				referenceType: 'topup',
				referenceId: topup.id,
				transactionKey: `topup:${topup.id}`,
				txHash: payload.txHash,
				description: `Topup credited from tx ${payload.txHash}`,
			});

			return topup;
		});

		// Forward the topped-up A0GI into the 0G Compute Ledger so providers can be paid.
		// Fire-and-forget: don't fail the topup response if this step errors — it can
		// be retried manually or via a background job.
		depositFundToComputeLedger(createdTopup.amount).catch((err) => {
			console.error('[topup] depositFundToComputeLedger failed:', err);
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
