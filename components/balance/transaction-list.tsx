import { db, schema } from '@/lib/db';
import { count, desc, eq } from 'drizzle-orm';
import TransactionItem from '@/components/balance/transaction-item';
import EmptyState from '@/components/layout/empty-state';
import type { CreditTransactionHistoryItem } from '@/lib/types';
import PaginationButton from '@/components/balance/pagination-button';

const LIMIT = 20;

interface TransactionListProps {
	userId: string;
	page?: number;
}

export default async function TransactionList({
	userId,
	page = 1,
}: TransactionListProps) {
	const offset = (page - 1) * LIMIT;

	const [transactions, [{ total }]] = await Promise.all([
		db
			.select()
			.from(schema.creditTransaction)
			.where(eq(schema.creditTransaction.userId, userId))
			.orderBy(desc(schema.creditTransaction.createdAt))
			.limit(LIMIT)
			.offset(offset) as Promise<CreditTransactionHistoryItem[]>,
		db
			.select({ total: count() })
			.from(schema.creditTransaction)
			.where(eq(schema.creditTransaction.userId, userId)),
	]);

	const totalPages = Math.ceil(total / LIMIT);

	if (transactions.length === 0) {
		return (
			<EmptyState
				title="No transactions yet."
				description="Your recent transactions will appear here."
				icon="heartbreak"
			/>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				{transactions.map((tx) => (
					<TransactionItem
						key={tx.id}
						transaction={tx}
					/>
				))}
			</div>
			{totalPages > 1 && (
				<div className="grid grid-cols-3 text-sm">
					<div className="flex justify-start">
						{page > 1 && (
							<PaginationButton
								type="previous"
								href={`?page=${page - 1}`}
							/>
						)}
					</div>
					<span className="text-neutral-400 text-center">
						{page} / {totalPages}
					</span>
					<div className="flex justify-end">
						{page < totalPages && (
							<PaginationButton
								type="next"
								href={`?page=${page + 1}`}
							/>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
