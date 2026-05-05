import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as typeof globalThis & {
	_sql?: ReturnType<typeof postgres>;
	_db?: DrizzleDB;
};

function getDb(): DrizzleDB {
	if (globalForDb._db) return globalForDb._db;
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) throw new Error('DATABASE_URL is not set');
	const sql =
		globalForDb._sql ??
		postgres(connectionString, { prepare: false });
	if (process.env.NODE_ENV !== 'production') globalForDb._sql = sql;
	globalForDb._db = drizzle(sql, { schema });
	return globalForDb._db;
}

// Lazy proxy — the connection is only established on the first query,
// not at module import time (which would break the Next.js build).
export const db = new Proxy({} as DrizzleDB, {
	get(_, prop: string | symbol) {
		return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
	},
});

export { schema };
export type DB = DrizzleDB;
