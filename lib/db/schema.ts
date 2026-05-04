import { randomUUID } from 'node:crypto';
import {
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from 'drizzle-orm/pg-core';

const createId = () => randomUUID();

export const user = pgTable(
	'user',
	{
		id: text('id').primaryKey().$defaultFn(createId),
		name: text('name').notNull(),
		email: text('email').notNull(),
		emailVerified: boolean('email_verified').notNull().default(false),
		image: text('image'),
		walletAddress: text('wallet_address').unique(),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		uniqueIndex('user_email_unique').on(table.email),
		uniqueIndex('user_wallet_address_unique').on(table.walletAddress),
	],
);

export const session = pgTable(
	'session',
	{
		id: text('id').primaryKey().$defaultFn(createId),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		token: text('token').notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		uniqueIndex('session_token_unique').on(table.token),
		index('session_user_id_idx').on(table.userId),
	],
);

export const account = pgTable(
	'account',
	{
		id: text('id').primaryKey().$defaultFn(createId),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		providerId: text('provider_id').notNull(),
		accountId: text('account_id').notNull(),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: timestamp('access_token_expires_at', {
			withTimezone: true,
		}),
		refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
			withTimezone: true,
		}),
		scope: text('scope'),
		password: text('password'),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		uniqueIndex('account_provider_account_unique').on(
			table.providerId,
			table.accountId,
		),
		index('account_user_id_idx').on(table.userId),
	],
);

export const verification = pgTable(
	'verification',
	{
		id: text('id').primaryKey().$defaultFn(createId),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [index('verification_identifier_idx').on(table.identifier)],
);

export const file = pgTable(
	'file',
	{
		id: text('id').primaryKey().$defaultFn(createId),
		ownerId: text('owner_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		storageHash: text('storage_hash').notNull(),
		filename: text('filename').notNull(),
		mimeType: text('mime_type'),
		sizeBytes: text('size_bytes').notNull().default('0'),
		quotedFee: text('quoted_fee').notNull().default('0'),
		chargedFee: text('charged_fee').notNull().default('0'),
		status: text('status').notNull().default('uploaded'),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index('file_owner_id_idx').on(table.ownerId),
		uniqueIndex('file_owner_storage_hash_unique').on(
			table.ownerId,
			table.storageHash,
		),
	],
);

export const creditBalance = pgTable(
	'credit_balance',
	{
		id: text('id').primaryKey().$defaultFn(createId),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		availableAmount: text('available_amount').notNull().default('0'),
		lockedAmount: text('locked_amount').notNull().default('0'),
		totalCredited: text('total_credited').notNull().default('0'),
		totalDebited: text('total_debited').notNull().default('0'),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		uniqueIndex('credit_balance_user_unique').on(table.userId),
		index('credit_balance_user_id_idx').on(table.userId),
	],
);

export const creditTransaction = pgTable(
	'credit_transaction',
	{
		id: text('id').primaryKey().$defaultFn(createId),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		balanceId: text('balance_id')
			.notNull()
			.references(() => creditBalance.id, { onDelete: 'cascade' }),
		type: text('type').notNull(),
		status: text('status').notNull().default('confirmed'),
		amount: text('amount').notNull(),
		balanceBefore: text('balance_before').notNull(),
		balanceAfter: text('balance_after').notNull(),
		referenceType: text('reference_type'),
		referenceId: text('reference_id'),
		transactionKey: text('transaction_key'),
		txHash: text('tx_hash'),
		description: text('description'),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index('credit_transaction_user_id_idx').on(table.userId),
		index('credit_transaction_balance_id_idx').on(table.balanceId),
		index('credit_transaction_type_idx').on(table.type),
		uniqueIndex('credit_transaction_key_unique').on(table.transactionKey),
		uniqueIndex('credit_transaction_tx_hash_unique').on(table.txHash),
	],
);

export const topup = pgTable(
	'topup',
	{
		id: text('id').primaryKey().$defaultFn(createId),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		walletAddress: text('wallet_address').notNull(),
		chainId: text('chain_id').notNull(),
		amount: text('amount').notNull(),
		txHash: text('tx_hash').notNull(),
		status: text('status').notNull().default('pending'),
		blockNumber: text('block_number'),
		creditedAt: timestamp('credited_at', { withTimezone: true }),
		confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index('topup_user_id_idx').on(table.userId),
		index('topup_wallet_address_idx').on(table.walletAddress),
		index('topup_status_idx').on(table.status),
		uniqueIndex('topup_tx_hash_unique').on(table.txHash),
	],
);

export const chatMessage = pgTable(
	'chat_message',
	{
		id: text('id').primaryKey().$defaultFn(createId),
		fileId: text('file_id')
			.notNull()
			.references(() => file.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		role: text('role').notNull(), // 'user' | 'assistant'
		content: text('content').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index('chat_message_file_user_idx').on(table.fileId, table.userId),
	],
);

export const walletAddress = pgTable(
	'wallet_address',
	{
		id: text('id').primaryKey().$defaultFn(createId),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		address: text('address').notNull(),
		chainId: text('chain_id').notNull(),
		isPrimary: boolean('is_primary').notNull().default(false),
		createdAt: timestamp('created_at', { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index('wallet_address_user_id_idx').on(table.userId),
		uniqueIndex('wallet_address_chain_unique').on(
			table.address,
			table.chainId,
		),
	],
);
