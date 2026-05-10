/**
 * Encode a UUID string to a 22-character base64url string.
 * A UUID is 16 bytes → 22 base64url chars (no padding).
 *
 * encodeShareId('110e8400-e29b-41d4-a716-446655440000')
 * // → 'EQ6EAOKbQdSnFkRmVUAA'  (22 chars)
 */
export function encodeShareId(uuid: string): string {
	const hex = uuid.replace(/-/g, '');
	const bytes = new Uint8Array(16);
	for (let i = 0; i < 16; i++) {
		bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	const base64 = btoa(String.fromCharCode(...bytes));
	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode a 22-character base64url string back to a UUID.
 *
 * decodeShareId('EQ6EAOKbQdSnFkRmVUAA')
 * // → '110e8400-e29b-41d4-a716-446655440000'
 */
export function decodeShareId(encoded: string): string {
	const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
	const padded = base64.padEnd(
		base64.length + ((4 - (base64.length % 4)) % 4),
		'=',
	);
	const binary = atob(padded);
	const hex = Array.from(binary)
		.map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
		.join('');
	return [
		hex.slice(0, 8),
		hex.slice(8, 12),
		hex.slice(12, 16),
		hex.slice(16, 20),
		hex.slice(20),
	].join('-');
}
