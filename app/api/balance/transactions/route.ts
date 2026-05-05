import { and, count, desc, eq, inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth/auth';
import { db, schema } from '@/lib/db';
import {
        creditReferenceTypes,
        creditTransactionStatuses,
        creditTransactionTypes,
        type CreditTransactionHistoryItem,
        type CreditReferenceType,
        type CreditTransactionStatus,
        type CreditTransactionType,
} from '@/lib/types/credits';

export const dynamic = 'force-dynamic';
// Returns paginated credit history for the balance section. Add filters like type, status, and referenceType so the UI can support “all / purchases / usage / refunds” without extra endpoints.

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

class BadRequestError extends Error {}

function parsePositiveInteger(
	value: string | null,
	fieldName: string,
	fallback: number,
	max?: number,
) {
	if (value === null) {
		return fallback;
	}

	const parsed = Number(value);

	if (!Number.isInteger(parsed) || parsed < 1) {
		throw new BadRequestError(`${fieldName} must be a positive integer`);
	}

	if (max !== undefined && parsed > max) {
		throw new BadRequestError(
			`${fieldName} must be less than or equal to ${max}`,
		);
	}

	return parsed;
}

function parseEnumFilter<T extends string>(
	searchParams: URLSearchParams,
	key: string,
	allowedValues: readonly T[],
) {
	const rawValues = searchParams
		.getAll(key)
		.flatMap((value) => value.split(','))
		.map((value) => value.trim())
		.filter(Boolean);

	if (rawValues.length === 0) {
		return undefined;
	}

	const allowedSet = new Set<string>(allowedValues);
	const invalidValue = rawValues.find((value) => !allowedSet.has(value));

	if (invalidValue) {
		throw new BadRequestError(`Invalid ${key}: ${invalidValue}`);
	}

	return [...new Set(rawValues)] as T[];
}

export async function GET(request: Request) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user?.id) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const page = parsePositiveInteger(
			searchParams.get('page'),
			'page',
			DEFAULT_PAGE,
		);
		const limit = parsePositiveInteger(
			searchParams.get('limit'),
			'limit',
			DEFAULT_LIMIT,
			MAX_LIMIT,
		);
		const types = parseEnumFilter<CreditTransactionType>(
			searchParams,
			'type',
			creditTransactionTypes,
		);
		const statuses = parseEnumFilter<CreditTransactionStatus>(
			searchParams,
			'status',
			creditTransactionStatuses,
		);
		const referenceTypes = parseEnumFilter<CreditReferenceType>(
			searchParams,
			'referenceType',
			creditReferenceTypes,
		);

		const filters = [eq(schema.creditTransaction.userId, session.user.id)];

		if (types) {
			filters.push(inArray(schema.creditTransaction.type, types));
		}

		if (statuses) {
			filters.push(inArray(schema.creditTransaction.status, statuses));
		}

		if (referenceTypes) {
			filters.push(
				inArray(schema.creditTransaction.referenceType, referenceTypes),
			);
		}

		const whereClause = and(...filters);
		const offset = (page - 1) * limit;

		const [{ total }] = await db
			.select({ total: count() })
			.from(schema.creditTransaction)
			.where(whereClause);

		const transactions = await db
			.select({
				id: schema.creditTransaction.id,
				type: schema.creditTransaction.type,
				status: schema.creditTransaction.status,
				amount: schema.creditTransaction.amount,
				balanceBefore: schema.creditTransaction.balanceBefore,
				balanceAfter: schema.creditTransaction.balanceAfter,
				referenceType: schema.creditTransaction.referenceType,
				referenceId: schema.creditTransaction.referenceId,
				transactionKey: schema.creditTransaction.transactionKey,
				txHash: schema.creditTransaction.txHash,
				description: schema.creditTransaction.description,
				createdAt: schema.creditTransaction.createdAt,
			})
			.from(schema.creditTransaction)
			.where(whereClause)
			.orderBy(
				desc(schema.creditTransaction.createdAt),
				desc(schema.creditTransaction.id),
			)
			.limit(limit)
			.offset(offset);

		const items: CreditTransactionHistoryItem[] = transactions.map(
			(transaction) => ({
				id: transaction.id,
				type: transaction.type as CreditTransactionType,
				status: transaction.status as CreditTransactionStatus,
				amount: transaction.amount,
				balanceBefore: transaction.balanceBefore,
				balanceAfter: transaction.balanceAfter,
				referenceType:
					(transaction.referenceType as CreditReferenceType | null) ??
					null,
				referenceId: transaction.referenceId,
				transactionKey: transaction.transactionKey,
				txHash: transaction.txHash,
				description: transaction.description,
				createdAt: transaction.createdAt,
			}),
		);

		const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

		return Response.json(
			{
				items,
				pagination: {
					page,
					limit,
					total,
					totalPages,
					hasPreviousPage: page > 1,
					hasNextPage: offset + items.length < total,
				},
			},
			{ status: 200 },
		);
	} catch (error) {
		if (error instanceof BadRequestError) {
			return Response.json({ error: error.message }, { status: 400 });
		}

		return Response.json(
			{ error: 'Unable to load balance transactions' },
			{ status: 500 },
		);
	}
}
