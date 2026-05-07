import type { CreditTransactionHistoryItem } from '@/lib/types';
import TxTypeIcon from './transaction-type-icon';
import CreditAmount from './credit-amount';

interface TransactionItemProps {
	transaction: CreditTransactionHistoryItem;
}
export default function TransactionItem({ transaction }: TransactionItemProps) {
	return (
		<div className="flex items-center gap-4 not-first:border-t border-t-neutral-300/50 dark:border-t-neutral-700/50 py-3">
			<TxTypeIcon type={transaction.type} />

			<div className="flex flex-col gap-1 grow">
				<time
					dateTime={new Date(transaction.createdAt).toISOString()}
					className="text-xs text-neutral-600 dark:text-neutral-400"
				>
					{new Date(transaction.createdAt).toLocaleString()}
				</time>
				{transaction.description && (
					<p className="text-sm text-neutral-800 dark:text-neutral-200">
						{transaction.description}
					</p>
				)}
			</div>

			<div className="flex justify-center items-center shrink-0">
				<CreditAmount amount={transaction.amount} />
			</div>
		</div>
	);
}
