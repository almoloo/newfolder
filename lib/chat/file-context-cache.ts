// ---------------------------------------------------------------------------
// File context cache
//
// Stores the processed file payload (system prompt text or image data URL)
// in memory so that subsequent chat messages for the same file don't need to
// re-download from 0G storage or re-run text extraction.
//
// Keys are `${userId}:${fileId}` to prevent cross-user cache hits.
// TTL defaults to 30 minutes and is reset on each access.
// ---------------------------------------------------------------------------

const TTL_MS = 30 * 60 * 1000; // 30 minutes

export interface CachedFileContext {
	/** Category of the file — drives how messages are assembled */
	category: 'image' | 'text' | 'document';
	/** For text/document: the full system prompt string */
	systemContent?: string;
	/** For image: the base64 data URL */
	imageDataUrl?: string;
	/** For image: system prompt string */
	imageSystemContent?: string;
}

interface Entry {
	context: CachedFileContext;
	expiresAt: number;
}

const cache = new Map<string, Entry>();

function cacheKey(userId: string, fileId: string): string {
	return `${userId}:${fileId}`;
}

export function getFileContext(
	userId: string,
	fileId: string,
): CachedFileContext | null {
	const key = cacheKey(userId, fileId);
	const entry = cache.get(key);
	if (!entry) return null;
	if (Date.now() > entry.expiresAt) {
		cache.delete(key);
		return null;
	}
	// Refresh TTL on access
	entry.expiresAt = Date.now() + TTL_MS;
	return entry.context;
}

export function setFileContext(
	userId: string,
	fileId: string,
	context: CachedFileContext,
): void {
	cache.set(cacheKey(userId, fileId), {
		context,
		expiresAt: Date.now() + TTL_MS,
	});
}

export function invalidateFileContext(userId: string, fileId: string): void {
	cache.delete(cacheKey(userId, fileId));
}
