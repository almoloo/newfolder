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
