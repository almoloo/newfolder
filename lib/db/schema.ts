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
