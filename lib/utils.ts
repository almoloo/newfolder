const NEURON_PER_STAR = BigInt('1000000000000'); // 10^12

/**
 * Converts a neuron amount (stored as a bigint string) to stars.
 * 1 star = 10^12 neuron.
 *
 * @param neuron - Amount in neuron as a string (e.g. "100000000000000")
 * @returns Stars as a number (e.g. 100)
 */
export function neuronToStars(neuron: string): number {
	return Number(BigInt(neuron) / NEURON_PER_STAR);
}

/**
 * Converts a star amount to neuron (for storage in the database).
 * 1 star = 10^12 neuron.
 *
 * @param stars - Amount in stars (e.g. 100)
 * @returns Neuron as a string (e.g. "100000000000000")
 */
export function starsToNeuron(stars: number): string {
	return String(BigInt(stars) * NEURON_PER_STAR);
}

/**
 * Converts a star amount to A0GI (0G native token).
 * 1 A0GI = 10^18 neuron = 10^6 stars.
 *
 * @param stars - Amount in stars (e.g. 1_000_000)
 * @returns A0GI as a number (e.g. 1.0)
 */
export function starsToZeroG(stars: number): number {
	return stars / 1_000_000;
}

/**
 * Formats a large number into a human-readable abbreviated string.
 * Strips trailing `.0` from the result (e.g. "1K" not "1.0K").
 *
 * @param amount - The number to format (e.g. 10000)
 * @returns Abbreviated string (e.g. "10K", "1.5M", "500")
 */
export function summarizeAmount(amount: number): string {
	if (amount >= 1_000_000) {
		return `${parseFloat((amount / 1_000_000).toFixed(1))}M`;
	} else if (amount >= 1_000) {
		return `${parseFloat((amount / 1_000).toFixed(1))}K`;
	} else {
		return amount.toString();
	}
}

export type FileCategory = 'image' | 'video' | 'audio' | 'document' | 'other';

const DOCUMENT_TYPES = new Set([
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/vnd.ms-powerpoint',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	'application/json',
	'application/xml',
	'application/rtf',
	'application/csv',
]);

export function getFileCategory(
	mimeType: string | null | undefined,
): FileCategory {
	if (!mimeType) return 'other';
	if (mimeType.startsWith('image/')) return 'image';
	if (mimeType.startsWith('video/')) return 'video';
	if (mimeType.startsWith('audio/')) return 'audio';
	if (mimeType.startsWith('text/')) return 'document';
	if (DOCUMENT_TYPES.has(mimeType)) return 'document';
	return 'other';
}

export function isChatSupported(mimeType: string | null | undefined): boolean {
	return getFileCategory(mimeType) === 'document';
}

export function timeAgo(date: Date | string): string {
	const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
	if (seconds < 60) return 'just now';
	const intervals: [number, string][] = [
		[31536000, 'year'],
		[2592000, 'month'],
		[604800, 'week'],
		[86400, 'day'],
		[3600, 'hour'],
		[60, 'minute'],
	];
	for (const [secs, label] of intervals) {
		const n = Math.floor(seconds / secs);
		if (n >= 1) return `${n} ${label}${n > 1 ? 's' : ''} ago`;
	}
	return 'just now';
}
