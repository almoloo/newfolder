export const creditTransactionTypes = [
	'topup',
	'debit',
	'refund',
	'adjustment',
	'hold',
	'release',
] as const;

export type CreditTransactionType = (typeof creditTransactionTypes)[number];

export const creditTransactionStatuses = [
	'pending',
	'confirmed',
	'failed',
	'reversed',
] as const;

export type CreditTransactionStatus =
	(typeof creditTransactionStatuses)[number];

export const topupStatuses = [
	'pending',
	'confirmed',
	'credited',
	'failed',
	'reorged',
] as const;

export type TopupStatus = (typeof topupStatuses)[number];

export const creditReferenceTypes = [
	'topup',
	'upload',
	'refund',
	'adjustment',
	'withdrawal',
	'chat',
] as const;

export type CreditReferenceType = (typeof creditReferenceTypes)[number];

export type CreditAmount = string;

export interface CreditBalanceSnapshot {
	availableAmount: CreditAmount;
	lockedAmount: CreditAmount;
	totalCredited: CreditAmount;
	totalDebited: CreditAmount;
}

/** Response body for GET /api/balance/summary */
export type BalanceSummaryResponse = CreditBalanceSnapshot;

export interface CreditLedgerEntry {
	type: CreditTransactionType;
	status: CreditTransactionStatus;
	amount: CreditAmount;
	balanceBefore: CreditAmount;
	balanceAfter: CreditAmount;
	referenceType?: CreditReferenceType | null;
	referenceId?: string | null;
	transactionKey?: string | null;
	txHash?: string | null;
	description?: string | null;
}

export interface CreditTransactionHistoryItem extends CreditLedgerEntry {
	id: string;
	createdAt: Date;
}

export interface PaginationMeta {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
	hasPreviousPage: boolean;
	hasNextPage: boolean;
}

/** Response body for GET /api/balance/transactions */
export interface BalanceTransactionsResponse {
	items: CreditTransactionHistoryItem[];
	pagination: PaginationMeta;
}

export interface TopupRecordInput {
	walletAddress: string;
	chainId: string;
	amount: CreditAmount;
	txHash: string;
	status?: TopupStatus;
	blockNumber?: string | null;
}
