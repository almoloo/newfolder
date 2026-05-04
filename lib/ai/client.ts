import { createZGComputeNetworkBroker } from '@0gfoundation/0g-compute-ts-sdk';
import { ethers } from 'ethers';
import { ZG_EVM_RPC } from '@/lib/storage/client';

export const ZG_COMPUTE_PROVIDER_ADDRESS =
	process.env.ZG_COMPUTE_PROVIDER_ADDRESS ?? '';

// Separate provider for vision/multimodal models (optional).
// Falls back to ZG_COMPUTE_PROVIDER_ADDRESS if not set.
export const ZG_COMPUTE_VISION_PROVIDER_ADDRESS =
	process.env.ZG_COMPUTE_VISION_PROVIDER_ADDRESS ||
	ZG_COMPUTE_PROVIDER_ADDRESS;

function createWallet() {
	const privateKey = process.env.ZG_PRIVATE_KEY;
	if (!privateKey) throw new Error('ZG_PRIVATE_KEY is not set');
	const provider = new ethers.JsonRpcProvider(ZG_EVM_RPC);
	return new ethers.Wallet(privateKey, provider);
}

export async function createBroker() {
	const wallet = createWallet();
	return createZGComputeNetworkBroker(wallet);
}

/**
 * Deposit funds into the 0G Compute Ledger so providers can be paid.
 * Called after a user topup is verified and credited — the treasury wallet
 * (ZG_PRIVATE_KEY) already received the A0GI from the auto-forwarding contract.
 *
 * @param amountInNeuron - Amount in neuron (1 A0GI = 10^18 neuron) as a bigint string.
 */
export async function depositFundToComputeLedger(
	amountInNeuron: string,
): Promise<void> {
	// SDK expects amount in A0GI (float), not neuron
	const amountIn0G = Number(BigInt(amountInNeuron)) / 1e18;
	if (amountIn0G <= 0) return;
	const broker = await createBroker();
	await broker.ledger.depositFund(amountIn0G);
}

// ---------------------------------------------------------------------------
// Auto-refill: top up the 0G Compute Ledger when balance drops below threshold
// ---------------------------------------------------------------------------

// Defaults: refill when below 1 A0GI, top up to 5 A0GI.
const REFILL_THRESHOLD_OG =
	parseFloat(process.env.ZG_LEDGER_REFILL_THRESHOLD_OG ?? '1') || 1;
const REFILL_TARGET_OG =
	parseFloat(process.env.ZG_LEDGER_REFILL_TARGET_OG ?? '5') || 5;

// Prevent concurrent refill transactions.
let _refillInProgress = false;

/**
 * Check the 0G Compute Ledger available balance and top it up if it has
 * dropped below ZG_LEDGER_REFILL_THRESHOLD_OG (default 1 A0GI).
 * Tops up to ZG_LEDGER_REFILL_TARGET_OG (default 5 A0GI).
 * Fire-and-forget safe — logs errors, never throws.
 */
export async function checkAndRefillComputeLedger(): Promise<void> {
	if (_refillInProgress) return;
	try {
		_refillInProgress = true;
		const broker = await createBroker();
		const ledger = await broker.ledger.getLedger();
		// availableBalance is in neuron; convert to A0GI for comparison
		const availableOG = Number(ledger.availableBalance) / 1e18;
		console.log(
			`[ledger] available balance: ${availableOG.toFixed(4)} A0GI (threshold: ${REFILL_THRESHOLD_OG})`,
		);
		if (availableOG < REFILL_THRESHOLD_OG) {
			const depositAmount = REFILL_TARGET_OG - availableOG;
			console.log(
				`[ledger] below threshold — depositing ${depositAmount.toFixed(4)} A0GI`,
			);
			await broker.ledger.depositFund(depositAmount);
			console.log('[ledger] deposit complete');
		}
	} catch (err) {
		console.error('[ledger] checkAndRefillComputeLedger failed:', err);
	} finally {
		_refillInProgress = false;
	}
}

// ---------------------------------------------------------------------------
// Provider pricing cache (5-minute TTL)
// ---------------------------------------------------------------------------

interface PricingEntry {
	inputPrice: bigint;
	outputPrice: bigint;
	expiresAt: number;
}

const _pricingCache = new Map<string, PricingEntry>();
const PRICING_CACHE_TTL_MS = 5 * 60 * 1000;

export async function getProviderPricing(
	providerAddress: string,
): Promise<{ inputPrice: bigint; outputPrice: bigint } | null> {
	if (!providerAddress) return null;
	const key = providerAddress.toLowerCase();
	const cached = _pricingCache.get(key);
	if (cached && cached.expiresAt > Date.now()) {
		return {
			inputPrice: cached.inputPrice,
			outputPrice: cached.outputPrice,
		};
	}
	try {
		const broker = await createBroker();
		const services = await broker.inference.listService(0, 100, true);
		const svc = services.find((s) => s.provider.toLowerCase() === key);
		if (!svc) {
			console.warn(
				'[getProviderPricing] provider not found in service list. Total services:',
				services.length,
				'Looking for:',
				key,
			);
			return null;
		}
		const entry: PricingEntry = {
			inputPrice: svc.inputPrice,
			outputPrice: svc.outputPrice,
			expiresAt: Date.now() + PRICING_CACHE_TTL_MS,
		};
		_pricingCache.set(key, entry);
		return { inputPrice: svc.inputPrice, outputPrice: svc.outputPrice };
	} catch (err) {
		console.error('[getProviderPricing]', err);
		return null;
	}
}
