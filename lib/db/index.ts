import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error('DATABASE_URL is not set');
}

const globalForDb = globalThis as typeof globalThis & {
	sql?: ReturnType<typeof postgres>;
};

const sql =
	globalForDb.sql ??
	postgres(connectionString, {
		prepare: false,
	});

if (process.env.NODE_ENV !== 'production') {
	globalForDb.sql = sql;
}

export const db = drizzle(sql, { schema });
export { schema, sql };
export type DB = typeof db;
