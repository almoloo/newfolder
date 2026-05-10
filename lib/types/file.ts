import type { InferSelectModel } from 'drizzle-orm';
import type { schema } from '@/lib/db';

export type FileRecord = Pick<
	InferSelectModel<typeof schema.file>,
	| 'id'
	| 'storageHash'
	| 'filename'
	| 'mimeType'
	| 'sizeBytes'
	| 'status'
	| 'createdAt'
>;
