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
] as const;

export type CreditReferenceType = (typeof creditReferenceTypes)[number];

export type CreditAmount = string;

export interface CreditBalanceSnapshot {
	availableAmount: CreditAmount;
	lockedAmount: CreditAmount;
	totalCredited: CreditAmount;
	totalDebited: CreditAmount;
}

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

export interface TopupRecordInput {
	walletAddress: string;
	chainId: string;
	amount: CreditAmount;
	txHash: string;
	status?: TopupStatus;
	blockNumber?: string | null;
}
