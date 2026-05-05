import { Indexer } from '@0gfoundation/0g-ts-sdk';
import { ethers } from 'ethers';

export const ZG_EVM_RPC =
	process.env.ZG_EVM_RPC ?? 'https://evmrpc-testnet.0g.ai';

const ZG_INDEXER_RPC =
	process.env.ZG_INDEXER_RPC ?? 'https://indexer-storage-testnet-turbo.0g.ai';

export function createIndexer() {
	return new Indexer(ZG_INDEXER_RPC);
}

export function createSigner() {
	const privateKey = process.env.ZG_PRIVATE_KEY;
	if (!privateKey) throw new Error('ZG_PRIVATE_KEY is not set');
	const provider = new ethers.JsonRpcProvider(ZG_EVM_RPC);
	return new ethers.Wallet(privateKey, provider);
}

/**
 * Wei charged to the user's credit balance per byte uploaded.
 * Set ZG_UPLOAD_FEE_PER_BYTE in .env to enable credit deduction.
 * Defaults to 0 (free uploads) on testnet.
 */
export const UPLOAD_FEE_PER_BYTE = BigInt(
	process.env.ZG_UPLOAD_FEE_PER_BYTE ?? '0',
);

/**
 * Encode one or more root hashes for storage in the DB.
 * Single hash is stored as-is; multiple are joined with `|`.
 */
export function encodeStorageHash(
	result:
		| { txHash: string; rootHash: string }
		| { txHashes: string[]; rootHashes: string[] },
): string {
	if ('rootHash' in result) return result.rootHash;
	return result.rootHashes.join('|');
}

/**
 * Decode a stored storageHash back into one or more root hashes
 * for use with indexer.download().
 */
export function decodeStorageHash(storageHash: string): string[] {
	return storageHash.split('|');
}
